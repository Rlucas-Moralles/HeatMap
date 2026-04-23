module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }]
  },
  moduleNameMapper: {
    "powerbi-visuals-api": "<rootDir>/tests/__mocks__/powerbi-visuals-api.ts",
    "powerbi-visuals-utils-formattingmodel": "<rootDir>/tests/__mocks__/powerbi-visuals-utils-formattingmodel.ts",
    "\\.less$": "<rootDir>/tests/__mocks__/style.ts"
  },
  testMatch: ["**/tests/**/*.test.ts"]
};
