/**
 * Jest configuration for Detox E2E tests
 * @see https://wix.github.io/Detox/docs/introduction/project-setup
 */

module.exports = {
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/native/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        presets: ["module:@react-native/babel-preset"]
      }
    ]
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testEnvironment: "node",
  testTimeout: 120000,
  setupFilesAfterEnv: ["<rootDir>/e2e/native/init.ts"],
  reporters: ["detox/runners/jest/reporter"],
  testRunner: "jest-circus/runner",
  verbose: true
};
