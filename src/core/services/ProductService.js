import { ProductDAO } from '#/src/core/data/ProductDAO.js';
import { BusinessError } from '../errors/BusinessError.js';

export class ProductService {
    constructor(dbClient) {
        this.productDAO = new ProductDAO(dbClient);
    }

    async findAll({ limit, page, filters }) {
        // Validation des paramètres métier
        if (limit > 100) {
            throw new BusinessError('La limite ne peut excéder 100 éléments');
        }

        // Appel au DAO avec logique métier
        const offset = (page - 1) * limit;
        return await this.productDAO.findAll(limit, offset, filters);
    }

    async create(productData) {
        // Règles business avant création
        await this.#validateBusinessRules(productData);
        
        // Enrichissement des données
        const enrichedData = {
            ...productData,
            createdAt: new Date(),
            updatedAt: new Date(),
            slug: this.#generateSlug(productData.name)
        };

        return await this.productDAO.create(enrichedData);
    }

    async updateStock(productId, quantity) {
        // Logique métier pour la gestion du stock
        const product = await this.productDAO.findById(productId);
        
        if (!product) {
            throw new BusinessError('Produit non trouvé');
        }

        if (product.stock < quantity) {
            throw new BusinessError(
                `Stock insuffisant. Disponible: ${product.stock}, demandé: ${quantity}`
            );
        }

        return await this.productDAO.updateStock(productId, quantity);
    }

    // Méthodes privées pour la logique métier
    async #validateBusinessRules(productData) {
        // Vérifications métier spécifiques
        if (await this.isNameTaken(productData.name)) {
            throw new BusinessError('Un produit avec ce nom existe déjà');
        }
    }

    #generateSlug(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
}
