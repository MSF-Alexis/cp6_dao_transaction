// src/tests/dao/ProductDAO.test.js
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProductDAO } from '#dao/ProductDao.js';
import { mockConnection, mockPool, mockResponses, resetMariadbMocks } from '#tests/mocks/database.mock.js';
import { validProduct, } from '#tests/fixtures/data.js';

import { setupTest, teardownTest } from '#tests/helper.js';


// Mock du module database
jest.mock('#config/database.js', () => ({
    pool: mockPool
}));

describe('ProductDAO', () => {
    let productDAO;

    beforeEach(() => {
        setupTest();
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        teardownTest();
    });

    describe('validateProduct', () => {
        test('devrait valider un produit correct', () => {
            expect(() => productDAO.validateProduct(validProduct)).not.toThrow();
        });
    });
});