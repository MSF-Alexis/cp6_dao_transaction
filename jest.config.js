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
        }
    },
    testMatch: [
        "**/__tests__/**/*.js",
        "**/*.test.js",
        "**/*.spec.js"
    ],
    setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"],
    transform: {},
};
