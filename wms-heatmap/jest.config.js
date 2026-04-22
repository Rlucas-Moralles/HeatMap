module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^d3$": "<rootDir>/tests/__mocks__/d3.ts",
    "powerbi-visuals-api": "<rootDir>/tests/__mocks__/powerbi-visuals-api.ts"
  }
};
