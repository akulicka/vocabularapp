import js from "@eslint/js";
import configPrettier from "eslint-config-prettier/flat";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  js.configs.recommended,
  {
    files: ["types/**/*.ts", "schemas/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-unused-vars": "off", // Turn off base rule
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-const": "error",
      "no-var": "error",
      ...configPrettier.rules,
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "**/*.js", "**/*.d.ts"],
  },
];
