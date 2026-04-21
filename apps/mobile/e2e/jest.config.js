/**
 * Jest configuration for Detox E2E tests
 * @see https://wix.github.io/Detox/docs/introduction/project-setup
 */

module.exports = {
  preset: "react-native",
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json"
      }
    ]
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testEnvironment: "node",
  testTimeout: 120000,
  setupFilesAfterEnv: ["<rootDir>/e2e/init.ts"],
  reporters: ["detox/runners/jest/reporter"],
  testRunner: "jest-circus/runner",
  verbose: true
};