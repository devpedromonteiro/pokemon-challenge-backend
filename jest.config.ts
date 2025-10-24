/** @jest-config-loader ts-node */
/** @jest-config-loader-options {"transpileOnly": true} */

import type { Config } from "jest";

const config: Config = {
    roots: ["<rootDir>/tests"],
    testEnvironment: "node",
    verbose: true,
    clearMocks: true,
    restoreMocks: true,
    testMatch: ["**/*.spec.ts"],
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
    },
    moduleFileExtensions: ["ts", "tsx", "js", "json"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    collectCoverage: true,
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/main/**/server*.ts",
        "!src/main/**/app*.ts",
        "!src/**/__mocks__/**",
    ],
    coverageDirectory: "coverage",
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: -10,
        },
    },
};

export default config;
