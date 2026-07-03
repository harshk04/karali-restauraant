import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["src/**/*.ts"],
  testMatch: ["**/*.spec.ts"],
  moduleNameMapper: {
    "^@karali/(.*)$": "<rootDir>/../../packages/$1/src",
  },
};

export default config;
