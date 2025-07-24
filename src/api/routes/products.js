import express from 'express';
import { ProductController } from '../controllers/ProductController.js';
import { validateProduct, validatePagination } from '../middlewares/validation.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();
const productController = new ProductController();

// GET /api/products - Liste paginée avec filtres
router.get('/', 
    validatePagination,
    productController.findAll.bind(productController)
);

// GET /api/products/:id - Produit par ID
router.get('/:id', 
    productController.findById.bind(productController)
);

// POST /api/products - Création avec validation
router.post('/', 
    authenticate,
    validateProduct,
    productController.create.bind(productController)
);

// PUT /api/products/:id - Mise à jour complète
router.put('/:id',
    authenticate,
    validateProduct,
    productController.update.bind(productController)
);

// PATCH /api/products/:id/stock - Mise à jour partielle du stock
router.patch('/:id/stock',
    authenticate,
    productController.updateStock.bind(productController)
);

// DELETE /api/products/:id - Suppression
router.delete('/:id',
    authenticate,
    productController.delete.bind(productController)
);

export default router;
