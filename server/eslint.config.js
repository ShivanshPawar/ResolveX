import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['node_modules', 'coverage'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node, ...globals.mocha },
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
]
