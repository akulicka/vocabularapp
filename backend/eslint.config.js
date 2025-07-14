import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";


export default defineConfig([
  { files: ["**/*.{js, mjs}"], plugins: { js }, extends: ["js/recommended"],       rules: {
      'no-case-declarations': 'warn',           
      }, },
  { files: ["**/*.{js, mjs}"], languageOptions: { globals: globals.node } },
  {
    files: ['db/models/**/*.cjs'],
    languageOptions: {
      sourceType: 'script', // Not 'module', because CJS
      ecmaVersion: 2020,
    },
    rules: {
      strict: 'off', // Sequelize sometimes uses sloppy JS
      'no-unused-vars': "warn",
    },
}
]);