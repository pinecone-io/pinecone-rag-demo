const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  // next/jest does not wire up the tsconfig `paths`, so map them here.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/app/$1",
  },
  clearMocks: true,
  collectCoverageFrom: [
    "src/app/**/*.{ts,tsx}",
    "!src/app/**/*.d.ts",
    "!src/app/layout.tsx",
    "!src/app/page.tsx",
    "!src/app/**/assets/**",
  ],
  coverageThreshold: {
    "./src/app/services/": {
      branches: 85,
      functions: 100,
      lines: 95,
      statements: 95,
    },
    "./src/app/utils/": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    "./src/app/api/crawl/crawler.ts": {
      branches: 70,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

module.exports = createJestConfig(config);
