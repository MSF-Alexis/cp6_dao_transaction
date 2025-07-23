export default {
    testEnvironment: "node",
    clearMocks: true,
    coverageDirectory: "coverage",
    coverageProvider: "v8",
    coverageReporters: ["json", "text", "lcov", "html"],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        },
        'ts-jest': {
            useESM: true
        }
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^#src/(.*)$': '<rootDir>/src/$1',
        '^#tests/(.*)$': '<rootDir>/src/tests/$1'
    },
    testMatch: [
        "**/__tests__/**/*.js",
        "**/*.test.js",
        "**/*.spec.js"
    ],
    setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"],
    testTimeout: 5000,
    transform: {},
};
