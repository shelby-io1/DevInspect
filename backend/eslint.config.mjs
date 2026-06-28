import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-eval": "warn",
      "no-console": "warn",
      "no-debugger": "warn",
      "prefer-const": "warn",
      "no-var": "warn",
      "eqeqeq": "warn",
      "curly": "warn",
      "no-throw-literal": "warn",
      "no-empty": "warn",
      "no-duplicate-case": "error",
      "no-extra-boolean-cast": "warn",
      "no-redeclare": "error",
      "no-unreachable": "warn",
      "valid-typeof": "error",
    }
  },
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"]
  }
];
