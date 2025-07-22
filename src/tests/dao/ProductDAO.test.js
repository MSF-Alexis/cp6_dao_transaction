import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { mockConnection, mockPool, mockResponses, resetMariadbMocks } from '#tests/mocks/database.mock.js';

jest.mock('#config/database.js', () => ({
    pool: mockPool
}));

import { ProductDAO } from '#dao/ProductDao.js';
import { validProduct } from '#tests/fixtures/data.js';
import { setupTest, teardownTest } from '#tests/helper.js';

describe('ProductDAO', () => {
    let productDAO;

    beforeEach(() => {
        setupTest();
        resetMariadbMocks();
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        teardownTest();
    });

    describe('validateProduct', () => {
        test('Produit correct', () => {
            expect(() => productDAO.validateProduct(validProduct)).not.toThrow();
        });
    });

    describe('rejectProduct', () => {
        test('Nom trop court (min 5)', () => {
            expect(() => productDAO.validateProduct({
                name: 'Heho',
                description: "C'est un test qui va échoué",
                price: 1.00,
                stock: 1
            })).toThrow('Le champ name doit contenir au moins 5 caractères');
        });

        test('Description trop courte (min 10)', () => {
            expect(() => productDAO.validateProduct({
                name: 'Super bol pokémon avec cuillière pikachu',
                description: "PasBon",
                price: 1.00,
                stock: 1
            })).toThrow('Le champ description doit contenir au moins 10 caractères');
        });

        test('Prix négatif', () => {
            expect(() => productDAO.validateProduct({
                name: 'Sac à dos cars avec petites roues',
                description: "Pour courir aussi vite que cars, Katchaoww !",
                price: -999.99,
                stock: 1
            })).toThrow('Le champ price doit être ≥ 0');
        });

        test('Stock négatif', () => {
            expect(() => productDAO.validateProduct({
                name: 'Voiture téléguidée Oui-Oui (ou Yes-Yes en anglais)',
                description: "C'est parfait pour les enfants",
                price: 29.99,
                stock: -1
            })).toThrow('Le champ stock doit être ≥ 0');
        });

        test('Stock non entier', () => {
            expect(() => productDAO.validateProduct({
                name: 'Produit test',
                description: "Description de test suffisamment longue",
                price: 10.00,
                stock: 2.5
            })).toThrow('Le champ stock doit être un entier');
        });
    });

    describe('create', () => {
        test('Produit valide qui doit retourner un id', async () => {
            /*  ARRANGE  */
            // Configuration des mocks
            mockConnection.query.mockResolvedValue(mockResponses.insertResult);
            mockConnection.beginTransaction.mockResolvedValue(undefined);
            mockConnection.commit.mockResolvedValue(undefined);
            mockConnection.rollback.mockResolvedValue(undefined);
            mockConnection.release.mockResolvedValue(undefined);

            /*  ACT  */
            const id = await productDAO.create(validProduct);

            /*  ASSERT  */
            expect(id).toBe(1);
            expect(mockPool.getConnection).toHaveBeenCalledTimes(1);
            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(mockConnection.query).toHaveBeenCalledWith(
                'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
                [validProduct.name, validProduct.description, validProduct.price, validProduct.stock]
            );
        });
    });
});