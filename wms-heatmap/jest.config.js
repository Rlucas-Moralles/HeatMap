module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^d3$": "<rootDir>/node_modules/d3/dist/d3.js",
    "powerbi-visuals-api": "<rootDir>/tests/__mocks__/powerbi-visuals-api.ts"
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        allowJs: true,
        esModuleInterop: true
      }
    }]
  }
};
