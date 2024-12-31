// @ts-check
import eslint from "@eslint/js";
import gitignore from "eslint-config-flat-gitignore";
import eslintConfigPrettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import tseslint from "typescript-eslint";

export default tseslint.config(
  gitignore({
    root: true,
  }),
  {
    files: ["{src,tests,tools}/**/*.{ts,tsx,mts}"],
    ignores: ["vite.config.ts"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      jsdoc,
    },
    extends: [
      gitignore(),
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      jsdoc.configs["flat/recommended-typescript"],
      eslintConfigPrettier,
    ],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "jsdoc/require-jsdoc": [
        "warn",
        {
          enableFixer: false,
          publicOnly: true,
        },
      ],
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: false,
          allowBoolean: true,
          allowNullish: true,
          allowNumber: true,
          allowRegExp: true,
        },
      ],
    },
  },
  {
    files: ["{src,tests,tools}/**/*.{js,jsx,mjs}"],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      // turn off other type-aware rules
      "deprecation/deprecation": "off",
      "@typescript-eslint/internal/no-poorly-typed-ts-props": "off",

      // turn off rules that don't apply to JS code
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
);
