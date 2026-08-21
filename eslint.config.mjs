import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["node_modules/**", ".next/**", "public/**", "_stitch_extract/**"]
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  }
];
