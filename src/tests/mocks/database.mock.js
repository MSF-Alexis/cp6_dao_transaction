// src/tests/mocks/mariadb.js
import { jest } from '@jest/globals';

// Mock pour la connexion MariaDB
export const mockConnection = {
    query: jest.fn(),
    execute: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    end: jest.fn(),
    release: jest.fn()
};

// Mock pour le pool de connexions
export const mockPool = {
    getConnection: jest.fn().mockResolvedValue(mockConnection),
    query: jest.fn(),
    execute: jest.fn(),
    end: jest.fn()
};

// Helper pour réinitialiser tous les mocks
export const resetMariadbMocks = () => {
    // Reset des méthodes de connexion
    mockConnection.query.mockReset();
    mockConnection.execute.mockReset();
    mockConnection.beginTransaction.mockReset();
    mockConnection.commit.mockReset();
    mockConnection.rollback.mockReset();
    mockConnection.end.mockReset();
    mockConnection.release.mockReset();
    
    // Reset des méthodes de pool et reconfiguration
    mockPool.getConnection.mockReset().mockResolvedValue(mockConnection);
    mockPool.query.mockReset();
    mockPool.execute.mockReset();
    mockPool.end.mockReset();
};

// Mock des réponses typiques de la base de données
export const mockResponses = {
    insertResult: {
        affectedRows: 1,
        insertId: 1,
        warningStatus: 0
    },
    updateResult: {
        affectedRows: 1,
        changedRows: 1,
        warningStatus: 0
    },
    deleteResult: {
        affectedRows: 1,
        warningStatus: 0
    },
    emptyResult: {
        affectedRows: 0,
        warningStatus: 0
    }
};
