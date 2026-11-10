import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["app/**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["server/**/*.js"],
    ignores: ["server/live-reload/client.js", "server/developer/docsClient.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.node, Bun: "readonly" } },
  },
  {
    files: ["server/live-reload/client.js", "server/developer/docsClient.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["views/**/*.jsx"],
    ...js.configs.recommended,
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": [
        "error",
        { varsIgnorePattern: "^[A-Z]", caughtErrors: "none" },
      ],
    },
  },
]);
