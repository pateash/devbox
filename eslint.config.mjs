import tseslint from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'
export default [{ files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'], languageOptions: { parser, parserOptions: { project: './tsconfig.json' } }, plugins: { '@typescript-eslint': tseslint }, rules: { ...tseslint.configs.recommended.rules } }, { ignores: ['out/**', 'dist/**', 'node_modules/**'] }]
