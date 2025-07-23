import { jest } from '@jest/globals';
global.jest = jest;
// Configuration globale pour les tests
// global.console = {
    // ...console,
    // Silencer les logs pendant les tests
//     log: jest.fn(),
//     warn: jest.fn(),
//     error: jest.fn(),
// };

// Timeout global pour les tests
jest.setTimeout(10000);

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// Configuration pour les mocks
beforeEach(() => {
    jest.clearAllMocks();
});

// Nettoyage après chaque test
afterEach(() => {
    jest.restoreAllMocks();
});