import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**", "**/coverage/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["apps/frontend/**/*.{ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    files: [
      "apps/frontend/app/(theme)/**/*.{ts,tsx}",
      "apps/frontend/components/theme1/**/*.{ts,tsx}",
      "apps/frontend/features/home/**/*.{ts,tsx}",
    ],
    rules: {
      "@next/next/no-css-tags": "off",
      "@next/next/no-img-element": "off",
    },
  },
];
