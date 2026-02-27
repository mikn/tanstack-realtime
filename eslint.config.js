// @ts-check

import { fileURLToPath } from 'node:url'
import { tanstackConfig } from '@tanstack/eslint-config'
import unusedImports from 'eslint-plugin-unused-imports'
import reactHooks from 'eslint-plugin-react-hooks'
import vitest from '@vitest/eslint-plugin'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default [
  ...tanstackConfig,
  {
    // Use projectService so TypeScript ESLint handles the monorepo tsconfigs
    // and files excluded from package-level tsconfigs (*.config.ts).
    name: 'tanstack/realtime/project-service',
    languageOptions: {
      parserOptions: {
        // Explicitly unset `project` — the base @tanstack/eslint-config sets
        // `project: true`, but we use `projectService` instead, and having
        // both is an error in typescript-eslint v8.
        project: false,
        // projectService uses TypeScript's Language Service API to resolve
        // tsconfigs for each file. The root tsconfig.json has no `include`
        // restriction so it covers most files. Root-level .js config files
        // (eslint.config.js, prettier.config.js) are not TypeScript and fall
        // back to allowDefaultProject.
        projectService: {
          allowDefaultProject: ['*.js'],
        },
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    name: 'tanstack/realtime/overrides',
    rules: {
      // Relax a few rules that are noisy for a transport/infra library
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'no-shadow': 'off',
    },
  },
  {
    name: 'tanstack/realtime/unused-imports',
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Only enable the two core hooks rules — not the React Compiler rules
    // introduced in react-hooks v7 (refs, immutability, purity, etc.) since
    // this project does not use the React Compiler.
    name: 'tanstack/realtime/react',
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    name: 'tanstack/realtime/tests',
    files: ['**/*.test.ts', '**/*.spec.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    settings: { vitest: { typecheck: true } },
  },
]
