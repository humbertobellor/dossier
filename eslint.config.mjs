import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.replit-artifact/**",
      "lib/*/src/generated/**",
      "lib/integrations/**",
      "artifacts/mockup-sandbox/**",
      "lib/api-spec/orval.config.ts",
      "lib/db/drizzle.config.ts",
    ],
  }
);
