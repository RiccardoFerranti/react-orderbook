import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

// Load prettier config to disable conflicting rules
const prettierConfig = compat.extends('prettier');

// Minimal flat config without Next.js config to avoid circular reference issues
const eslintConfig = [
  // Prettier config (disables conflicting ESLint rules)
  ...prettierConfig,
  {
    ignores: ['public/**', 'node_modules/**', '.next/**', 'out/**', 'build/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      semi: ['error'],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['PascalCase'],
          prefix: ['I'],
          selector: 'interface',
        },
        {
          format: ['PascalCase'],
          prefix: ['T'],
          selector: ['typeAlias'],
        },
        {
          format: ['StrictPascalCase'],
          prefix: ['E'],
          selector: 'enum',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
          'newlines-between': 'always',
        },
      ],
      'max-len': [
        'error',
        {
          code: 130,
        },
      ],
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      'eol-last': ['error', 'always'],
    },
  },
];

export default eslintConfig;

