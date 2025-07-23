import DatabaseClientInterface from "#src/core/database/DatabaseClientInterface.js";

class ProductDAO {
    /**
     * 
     * @param {DatabaseClientInterface} dbClient 
     */
    constructor(dbClient) {
        this.dbClient = dbClient;
    }

    /**
     * Valide les propriétés d'un produit selon les règles métier
     * @param {Object} product - Objet produit à valider
     * @throws {Error} - Erreur de validation détaillée
     */
    validateProduct(product) {
        const schema = {
            name: { type: 'string', min: 5 },
            description: { type: 'string', min: 10 },
            price: { type: 'number', min: 0 },
            stock: { type: 'number', min: 0, integer: true }
        };

        for (const key in schema) {
            const rule = schema[key];
            const value = product[key];

            if (value === undefined || value === null)
                throw new Error(`Le champ ${key} est obligatoire`);
            if (typeof value !== rule.type)
                throw new Error(`Le champ ${key} doit être de type ${rule.type}`);
            if (rule.type === 'string' && value.length < rule.min)
                throw new Error(`Le champ ${key} doit contenir au moins ${rule.min} caractères`);
            if (rule.type === 'number' && value < rule.min)
                throw new Error(`Le champ ${key} doit être ≥ ${rule.min}`);
            if (rule.integer && !Number.isInteger(value))
                throw new Error(`Le champ ${key} doit être un entier`);
        }
    }

    /**
     * Crée un nouveau produit avec gestion transactionnelle
     * @param {Object} product - Données du produit {name, description, price, stock}
     * @returns {Promise<number>} - ID du produit créé
     * @throws {Error} - Erreur de validation ou base de données
     */
    async create(product) {
        try {
            this.validateProduct(product);
            return await this.dbClient.transaction(async (clientConnection) => {
                return await clientConnection.query(
                    'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
                    [product.name, product.description, product.price, product.stock]
                );
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Récupère les produits paginés + métadonnées de pagination
     * @param {number} limit  - Éléments par page (défaut : 50, min : 1, max : 200)
     * @param {number} page   - Page courante (défaut : 1, min : 1)
     * @returns {Promise<{products: Array, pagination: {perPage:number, page:number, maxPage:number, total:number}}>}
     */
    async findAll(limit = 50, page = 1) {
        // ------------ Validation des paramètres ------------
        if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
            throw new Error('Le paramètre limit doit être un entier compris entre 1 et 200');
        }
        if (!Number.isInteger(page) || page < 1) {
            throw new Error('Le paramètre page doit être un entier positif');
        }

        // ------------ Calcul de l’offset ------------
        const offset = (page - 1) * limit;

        // ------------ Total d’enregistrements ------------
        const [{ total }] = await this.dbClient.query(
            'SELECT COUNT(*) AS total FROM products'
        );

        // Dès qu’il n’y a rien : réponse immédiate
        if (total === 0) {
            return {
                products: [],
                pagination: { perPage: limit, page, maxPage: 0, total: 0 }
            };
        }

        // ------------ Récupération de la page demandée ------------
        const products = await this.dbClient.query(
            `SELECT id, name, description, price, stock, created_at, updated_at
       FROM products
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        // ------------ Construction de la réponse ------------
        const maxPage = Math.ceil(total / limit);

        return {
            products,
            pagination: {
                perPage: limit,
                page,
                maxPage,
                total
            }
        };
    }
    /**
     * Récupère un produit par son ID
     * @param {number} id - ID du produit
     * @returns {Promise<Object|null>} - Produit trouvé ou null
     */
    async findById(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('L\'ID doit être un entier positif');
        }

        return await this.dbClient.query(
            `SELECT id, name, description, price, stock, created_at, updated_at 
                    FROM products 
                    WHERE id = ?`,
            [id]
        )[0] || null;
    }

    /**
     * Récupère un produit avec verrouillage pour mise à jour
     * @param {number} id - ID du produit
     * @returns {Promise<Object|null>} - Produit avec verrou ou null
     */
    async findByIdForUpdate(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('L\'ID doit être un entier positif');
        }

        return await this.dbClient.query(
            `SELECT id, name, description, price, stock, created_at, updated_at 
                 FROM products 
                 WHERE id = ? FOR UPDATE`,
            [id]
        )[0] || null;
    }

    /**
     * Met à jour un produit existant avec gestion transactionnelle
     * @param {number} id - ID du produit à modifier
     * @param {Object} productData - Nouvelles données du produit
     * @returns {Promise<boolean>} - true si mise à jour réussie
     */
    async update(id, productData) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('L\'ID doit être un entier positif');
        }

        this.validateProduct(productData);
        const existingProduct = await this.dbClient.query(
            'SELECT id FROM products WHERE id = ?',
            [id]
        );

        if (!existingProduct[0]) {
            throw new Error(`Produit avec l'ID ${id} non trouvé`);
        }

        return await this.dbClient.transaction(async (clientConnection) => {
            return await clientConnection.query(
                `UPDATE products 
                 SET name = ?, description = ?, price = ?, stock = ?, updated_at = NOW() 
                 WHERE id = ?`,
                [productData.name, productData.description, productData.price, productData.stock, id]
            )
        })?.result.affectedRows > 0;
    }

    /**
     * Mise à jour du stock d'un produit (méthode transactionnelle critique)
     * @param {number} id - ID du produit
     * @param {number} quantity - Quantité à décrémenter
     * @returns {Promise<boolean>} - true si mise à jour réussie
     */
    async updateStock(id, quantity) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('L\'ID doit être un entier positif');
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new Error('La quantité doit être un entier positif');
        }

        // Vérification du stock disponible avec verrouillage
        const product = await this.dbClient.query(
            'SELECT stock FROM products WHERE id = ? FOR UPDATE',
            [id]
        );

        if (!product[0]) {
            throw new Error(`Produit avec l'ID ${id} non trouvé`);
        }

        if (product[0].stock < quantity) {
            throw new Error(`Stock insuffisant. Disponible: ${product[0].stock}, Demandé: ${quantity}`);
        }

        return await this.dbClient.transaction(async (clientConnection) => {
            return await clientConnection.query(
                `UPDATE products 
                 SET stock = stock - ?, updated_at = NOW() 
                 WHERE id = ?`,
                [quantity, id]
            );
        })?.result.affectedRows > 0;
    }

    /**
     * Supprime un produit (soft delete avec vérification métier)
     * @param {number} id - ID du produit à supprimer
     * @returns {Promise<boolean>} - true si suppression réussie
     */
    async delete(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('L\'ID doit être un entier positif');
        }


        // Vérification que le produit n'est pas dans des commandes en cours
        const ordersCount = await this.dbClient.query(
            `SELECT COUNT(*) as count 
                 FROM order_items oi 
                 JOIN orders o ON oi.order_id = o.id 
                 WHERE oi.product_id = ? AND o.status IN ('pending', 'processing')`,
            [id]
        );

        if (ordersCount[0].count > 0) {
            throw new Error('Impossible de supprimer un produit ayant des commandes en cours');
        }

        return await this.dbClient.transaction(async (clientConnection) => {
            return await clientConnection.query(
                'DELETE FROM products WHERE id = ?',
                [id]
            );
        })?.result.affectedRows > 0;


    }

    /**
  * Recherche de produits avec filtres + pagination détaillée
  *
  * @param {Object}  filters        - { name, minPrice, maxPrice, inStock }
  * @param {number}  limit          - Éléments par page (def. 20, min 1, max 200)
  * @param {number}  page           - Numéro de page (def. 1, min 1)
  * @returns {Promise<{products:Array, total:number, pagination:Object}>}
  */
    async search(filters = {}, limit = 20, page = 1) {
        if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
            throw new Error("Le paramètre limit doit être un entier entre 1 et 200");
        }
        if (!Number.isInteger(page) || page < 1) {
            throw new Error("Le paramètre page doit être un entier positif");
        }

        const where = [];
        const params = [];

        if (filters.name) {
            where.push("name LIKE ?");
            params.push(`%${filters.name}%`);
        }
        if (filters.minPrice !== undefined) {
            where.push("price >= ?");
            params.push(filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            where.push("price <= ?");
            params.push(filters.maxPrice);
        }
        if (filters.inStock === true) {
            where.push("stock > 0");
        }

        const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

        const [{ total }] = await this.dbClient.query(
            `SELECT COUNT(*) AS total FROM products ${whereClause}`,
            params
        );

        if (total === 0) {
            return {
                products: [],
                total: 0,
                pagination: { perPage: limit, page, maxPage: 0, hasNext: false }
            };
        }

        const maxPage = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        const products = await this.dbClient.query(
            `SELECT id, name, description, price, stock, created_at, updated_at
            FROM products ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return {
            products,
            total,
            pagination: {
                perPage: limit,
                page,
                maxPage,
                hasNext: page < maxPage
            }
        };
    }


    /**
     * Compte le nombre total de produits
     * @returns {Promise<number>} - Nombre total de produits
     */
    async count() {
        return await this.dbClient.query('SELECT COUNT(*) as count FROM products')[0]?.count;
    }

    /**
     * Vérifie la disponibilité de stock pour une quantité donnée
     * @param {number} id - ID du produit
     * @param {number} quantity - Quantité souhaitée
     * @returns {Promise<boolean>} - true si stock suffisant
     */
    async checkStock(id, quantity) {
        const product = await this.findById(id);

        if (!product) {
            throw new Error(`Produit avec l'ID ${id} non trouvé`);
        }

        return product.stock >= quantity;
    }

    /**
     * Ferme le pool de connexions (à appeler lors de l'arrêt de l'application)
     */
    async close() {
        try {
            await pool.end();
        } catch (error) {
            console.error('Erreur lors de la fermeture du pool:', error);
            throw error;
        }
    }
}

export { ProductDAO };
