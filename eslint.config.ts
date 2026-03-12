import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      'dist',
      'dev-dist',
      'tailwind.config.*',
      'postcss.config.*',
      'vite.config.*',
      'vitest.config.*',
      'eslint.config.*',
      'e2e/**',
      'playwright.config.ts'
    ]
  },
  {
    files: ['**/*.{js,jsx}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module'
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug'] }]
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Changed to warning for development
      'no-unused-vars': 'off', // Disabled in favor of @typescript-eslint/no-unused-vars
      // Regla estricta para console.log - permitir warn, error, info, debug
      'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug'] }],
      'prefer-const': 'warn',
      // Disable problematic rules that don't exist or cause false positives
      'react/forbid-dom-props': 'off',
      'jsx-a11y/aria-proptypes': 'off',
      'jsx-a11y/aria-props': 'off',
      'jsx-a11y/aria-unsupported-elements': 'off',
      'jsx-a11y/aria-role': 'off',
      'jsx-a11y/aria-allowed-attr': 'off',
      'jsx-a11y/aria-invalid-attr-value': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'jsx-a11y/no-static-element-interactions': 'off'
    }
  }
]
