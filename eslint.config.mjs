import eslint from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
    // Apply base ESLint rules only to src directory
    {
        files: ["src/**/*.ts", "src/**/*.tsx"],
        extends: [eslint.configs.recommended],
    },
    // Apply TypeScript checking only to TypeScript files in src directory
    {
        files: ["src/**/*.ts", "src/**/*.tsx"],
        extends: [tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-base-to-string": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-floating-promises": "off",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/no-unnecessary-condition": "error",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unused-vars": ["warn", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }],
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/switch-exhaustiveness-check": "warn",
            "@typescript-eslint/unbound-method": "off",
            "no-constant-condition": "off",
            "no-debugger": "warn",
            "prefer-const": "off",
        },
    },
    // Disable TypeScript checking for JavaScript config files
    {
        files: ["**/*.js", "**/*.mjs"],
        ...tseslint.configs.disableTypeChecked,
    },
)
