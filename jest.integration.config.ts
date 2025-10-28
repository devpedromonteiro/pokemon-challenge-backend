/** @jest-config-loader ts-node */
/** @jest-config-loader-options {"transpileOnly": true} */

import type { Config } from "jest";

const config: Config = {
    roots: ["<rootDir>/tests"],
    testEnvironment: "node",
    verbose: true,
    clearMocks: true,
    restoreMocks: true,
    testMatch: ["**/*.test.ts"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup-integration.ts"],
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
    },
    moduleFileExtensions: ["ts", "tsx", "js", "json"],
    moduleNameMapper: {
        "^@/tests/(.*)$": "<rootDir>/tests/$1",
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    collectCoverage: false,
    testTimeout: 10000,
    forceExit: true,
    detectOpenHandles: false,
};

export default config;
