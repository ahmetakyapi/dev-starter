import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off',

      // TypeScript'in kendisi tanimsiz degiskeni zaten yakalar; no-undef ise
      // tip-uzayindaki isimleri (HTMLDivElement, React, IntersectionObserver)
      // gormedigi icin toplu false-positive uretir — ilk gercek `npm run lint`
      // kosusunda 128 sahte hatanin tamami buydu. typescript-eslint'in
      // belgelenmis onerisi: TS dosyalarinda kapat.
      'no-undef': 'off',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
    },
  },
  {
    // Flat config'te `dist/` YALNIZCA kok seviyedeki dist'i eslesitirir —
    // packages/@ahmet/ui/dist bu yuzden lint'lenip 57 sahte hata uretiyordu.
    // Ic ice dizinler icin `**/` oneki sart.
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      'templates/**',
    ],
  },
]
