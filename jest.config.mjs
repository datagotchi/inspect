import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^d3$": "<rootDir>/node_modules/d3/dist/d3.min.js",
    "\\.(css)$": "<rootDir>/src/app/tests/__mocks__/styleMock.ts",
    "^\\.\\./models/reactions$": "<rootDir>/src/app/api/models/reactions",
  },
  testMatch: ["**/*.test.(ts|tsx)"],
  verbose: true,
  testTimeout: 20000,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
