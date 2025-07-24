import { ProductService } from '../../core/services/ProductService.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export class ProductController {
    constructor() {
        this.productService = new ProductService();
    }

    async findAll(req, res, next) {
        try {
            const { limit = 50, page = 1, ...filters } = req.query;
            
            const result = await this.productService.findAll({
                limit: parseInt(limit),
                page: parseInt(page),
                filters
            });

            res.status(200).json(ApiResponse.success({
                products: result.products,
                pagination: result.pagination
            }));
        } catch (error) {
            next(error);
        }
    }

    async findById(req, res, next) {
        try {
            const { id } = req.params;
            const product = await this.productService.findById(parseInt(id));
            
            if (!product) {
                return res.status(404).json(
                    ApiResponse.notFound('Produit non trouvé')
                );
            }

            res.status(200).json(ApiResponse.success(product));
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const productData = req.body;
            const createdProduct = await this.productService.create(productData);
            
            res.status(201).json(ApiResponse.created(createdProduct));
        } catch (error) {
            next(error);
        }
    }

    // Autres méthodes similaires...
}
