import { pool } from "#config/database.js";

/**
 * DAO pour la gestion des commandes et de leurs lignes
 * Conformité RNCP 37674 – BC02.2 : accès transactionnel, intégrité, gestion des conflits
 */
class OrderDAO {
    /**
     * Valide la structure d'une commande
     * @param {Object} order - {customerName: string, items: [{productId: number, quantity: number}]}
     * @throws {Error} Si la structure est invalide
     */
    validateOrder(order) {
        if (!order || typeof order !== "object") {
            throw new Error("La commande doit être un objet");
        }
        
        if (!order.customerName || typeof order.customerName !== "string" || order.customerName.length < 2) {
            throw new Error("Le nom client est obligatoire (≥ 2 caractères)");
        }
        
        if (!Array.isArray(order.items) || order.items.length === 0) {
            throw new Error("La commande doit contenir au moins un item");
        }
        
        for (const item of order.items) {
            if (!Number.isInteger(item.productId) || item.productId <= 0) {
                throw new Error("L'ID produit doit être un entier positif");
            }
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new Error("La quantité doit être un entier positif");
            }
        }
    }

    /**
     * Crée une commande avec gestion transactionnelle du stock
     * @param {Object} order - Données de la commande
     * @returns {Promise<number>} ID de la commande créée
     */
    async create(order) {
        this.validateOrder(order);

        let conn;
        try {
            conn = await pool.getConnection();
            await conn.beginTransaction();

            // Étape 1: Vérifier et verrouiller chaque produit
            for (const item of order.items) {
                const products = await conn.query(
                    "SELECT id, name, stock FROM products WHERE id = ? FOR UPDATE",
                    [item.productId]
                );
                
                if (products.length === 0) {
                    throw new Error(`Produit ${item.productId} introuvable`);
                }
                
                const product = products[0];
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuffisant pour ${product.name} (disponible: ${product.stock}, demandé: ${item.quantity})`);
                }
            }

            // Étape 2: Créer la commande
            const orderResult = await conn.query(
                "INSERT INTO orders (customer_name, status, created_at, updated_at) VALUES (?, 'pending', NOW(), NOW())",
                [order.customerName]
            );
            const orderId = orderResult.insertId;

            // Étape 3: Créer les lignes de commande et décrémenter le stock
            for (const item of order.items) {
                // Insérer la ligne de commande
                await conn.query(
                    "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
                    [orderId, item.productId, item.quantity]
                );
                
                // Décrémenter le stock
                await conn.query(
                    "UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?",
                    [item.quantity, item.productId]
                );
            }

            await conn.commit();
            return orderId;
        } catch (err) {
            if (conn) await conn.rollback();
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Récupère toutes les commandes avec pagination
     * @param {number} limit - Nombre de commandes par page
     * @param {number} offset - Décalage pour la pagination
     * @returns {Promise<Array>} Liste des commandes
     */
    async findAll(limit = 50, offset = 0) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            const orders = await conn.query(
                `SELECT id, customer_name, status, created_at, updated_at 
                 FROM orders 
                 ORDER BY created_at DESC 
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            
            return orders;
        } catch (error) {
            console.error("Erreur lors de la récupération des commandes:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Récupère une commande avec ses items
     * @param {number} id - ID de la commande
     * @returns {Promise<Object|null>} Commande avec items ou null
     */
    async findById(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("L'ID doit être un entier positif");
        }

        let conn;
        try {
            conn = await pool.getConnection();

            // Récupérer la commande
            const orders = await conn.query(
                "SELECT id, customer_name, status, created_at, updated_at FROM orders WHERE id = ?",
                [id]
            );

            if (orders.length === 0) return null;
            const order = orders[0];

            // Récupérer les items de la commande
            const items = await conn.query(
                `SELECT oi.product_id, p.name, p.price, oi.quantity,
                        (p.price * oi.quantity) as total_price
                 FROM order_items oi
                 JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = ?`,
                [id]
            );

            return { ...order, items };
        } catch (error) {
            console.error("Erreur lors de la récupération de la commande:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Met à jour le statut d'une commande
     * @param {number} id - ID de la commande
     * @param {string} status - Nouveau statut
     * @returns {Promise<boolean>} true si mise à jour réussie
     */
    async updateStatus(id, status) {
        const allowedStatuses = ["pending", "processing", "completed", "cancelled"];
        
        if (!allowedStatuses.includes(status)) {
            throw new Error(`Statut invalide. Autorisés: ${allowedStatuses.join(", ")}`);
        }

        let conn;
        try {
            conn = await pool.getConnection();
            await conn.beginTransaction();

            const result = await conn.query(
                "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
                [status, id]
            );

            await conn.commit();
            return result.affectedRows > 0;
        } catch (err) {
            if (conn) await conn.rollback();
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Supprime une commande et recrédite le stock
     * @param {number} id - ID de la commande
     * @returns {Promise<boolean>} true si suppression réussie
     */
    async delete(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("L'ID doit être un entier positif");
        }

        let conn;
        try {
            conn = await pool.getConnection();
            await conn.beginTransaction();

            // Vérifier que la commande peut être supprimée
            const orders = await conn.query(
                "SELECT status FROM orders WHERE id = ?",
                [id]
            );

            if (orders.length === 0) {
                throw new Error("Commande introuvable");
            }

            if (orders[0].status !== "pending") {
                throw new Error("Seules les commandes en attente peuvent être supprimées");
            }

            // Récupérer les items pour recréditer le stock
            const items = await conn.query(
                "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
                [id]
            );

            // Supprimer les items
            await conn.query("DELETE FROM order_items WHERE order_id = ?", [id]);

            // Supprimer la commande
            const result = await conn.query("DELETE FROM orders WHERE id = ?", [id]);

            // Recréditer le stock
            for (const item of items) {
                await conn.query(
                    "UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?",
                    [item.quantity, item.product_id]
                );
            }

            await conn.commit();
            return result.affectedRows > 0;
        } catch (err) {
            if (conn) await conn.rollback();
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Recherche des commandes par statut
     * @param {string} status - Statut recherché
     * @param {number} limit - Limite de résultats
     * @param {number} offset - Décalage pagination
     * @returns {Promise<Array>} Liste des commandes
     */
    async findByStatus(status, limit = 50, offset = 0) {
        const allowedStatuses = ["pending", "processing", "completed", "cancelled"];
        
        if (!allowedStatuses.includes(status)) {
            throw new Error(`Statut invalide. Autorisés: ${allowedStatuses.join(", ")}`);
        }

        let conn;
        try {
            conn = await pool.getConnection();
            
            const orders = await conn.query(
                `SELECT id, customer_name, status, created_at, updated_at
                 FROM orders 
                 WHERE status = ?
                 ORDER BY created_at DESC 
                 LIMIT ? OFFSET ?`,
                [status, limit, offset]
            );
            
            return orders;
        } catch (error) {
            console.error("Erreur lors de la recherche par statut:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Recherche des commandes d'un client
     * @param {string} customerName - Nom du client
     * @param {number} limit - Limite de résultats
     * @param {number} offset - Décalage pagination
     * @returns {Promise<Array>} Liste des commandes
     */
    async findByCustomer(customerName, limit = 50, offset = 0) {
        if (!customerName || typeof customerName !== "string") {
            throw new Error("Le nom client est requis");
        }

        let conn;
        try {
            conn = await pool.getConnection();
            
            const orders = await conn.query(
                `SELECT id, customer_name, status, created_at, updated_at
                 FROM orders 
                 WHERE customer_name LIKE ?
                 ORDER BY created_at DESC 
                 LIMIT ? OFFSET ?`,
                [`%${customerName}%`, limit, offset]
            );
            
            return orders;
        } catch (error) {
            console.error("Erreur lors de la recherche par client:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Calcule le montant total d'une commande
     * @param {number} orderId - ID de la commande
     * @returns {Promise<number>} Montant total
     */
    async calculateTotal(orderId) {
        if (!Number.isInteger(orderId) || orderId <= 0) {
            throw new Error("L'ID doit être un entier positif");
        }

        let conn;
        try {
            conn = await pool.getConnection();
            
            const result = await conn.query(
                `SELECT SUM(p.price * oi.quantity) as total
                 FROM order_items oi
                 JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = ?`,
                [orderId]
            );
            
            return result[0]?.total || 0;
        } catch (error) {
            console.error("Erreur lors du calcul du total:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Compte le nombre total de commandes
     * @returns {Promise<number>} Nombre total
     */
    async count() {
        let conn;
        try {
            conn = await pool.getConnection();
            
            const result = await conn.query("SELECT COUNT(*) as count FROM orders");
            return result[0].count;
        } catch (error) {
            console.error("Erreur lors du comptage:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Recherche avancée avec filtres multiples
     * @param {Object} filters - Filtres de recherche
     * @param {number} limit - Limite de résultats
     * @param {number} offset - Décalage pagination
     * @returns {Promise<{orders: Array, total: number}>} Résultats paginés
     */
    async search(filters = {}, limit = 20, offset = 0) {
        let conn;
        try {
            conn = await pool.getConnection();

            let whereConditions = [];
            let params = [];

            if (filters.customerName) {
                whereConditions.push("customer_name LIKE ?");
                params.push(`%${filters.customerName}%`);
            }

            if (filters.status) {
                whereConditions.push("status = ?");
                params.push(filters.status);
            }

            if (filters.startDate) {
                whereConditions.push("created_at >= ?");
                params.push(filters.startDate);
            }

            if (filters.endDate) {
                whereConditions.push("created_at <= ?");
                params.push(filters.endDate);
            }

            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(" AND ")}` 
                : "";

            // Requête de comptage
            const countResult = await conn.query(
                `SELECT COUNT(*) as total FROM orders ${whereClause}`,
                params
            );

            // Requête des données
            const orders = await conn.query(
                `SELECT id, customer_name, status, created_at, updated_at
                 FROM orders ${whereClause}
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            return {
                orders,
                total: countResult[0].total,
                pagination: {
                    limit,
                    offset,
                    hasNext: (offset + limit) < countResult[0].total
                }
            };
        } catch (error) {
            console.error("Erreur lors de la recherche:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }
}

export { OrderDAO };
