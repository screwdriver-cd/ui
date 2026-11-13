import js from '@eslint/js';
import formatjs from 'eslint-plugin-formatjs';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import noLiteralText from './eslint-rules/no-literal-text.js';
import tseslint from 'typescript-eslint';

// Directories owned by other in-flight feature work: findings are reported as
// warnings until those features are cleaned up, then move them out of this list.
const WARN_ONLY = [
  'src/features/pipeline/**',
  'src/features/build/**',
  'src/features/templates/**',
  'src/features/commands/**',
  'src/features/workflow-graph/**'
];

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'public', 'extracted-messages.json'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { formatjs, local: { rules: { 'no-literal-text': noLiteralText } } },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // User-visible text must go through useT(); see README "No raw UI strings".
      // formatjs/no-literal-string-in-jsx also flags {' '} and glyphs, so a local rule is used.
      'local/no-literal-text': 'error',
      // Modal fields are focused on open on purpose; the rule is kept for plain DOM elements.
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
      // ICU syntax in the locale files is validated by src/i18n/i18n.test.ts; inline
      // formatMessage descriptors are not used (ids live in locales/*.json).
      'formatjs/no-offset': 'error',
      'formatjs/no-multiple-whitespaces': 'error'
    }
  },
  {
    files: ['**/*.config.{js,ts}'],
    languageOptions: { globals: { ...globals.node } }
  },
  {
    files: WARN_ONLY,
    rules: Object.fromEntries(
      [
        'local/no-literal-text',
        '@typescript-eslint/consistent-type-imports',
        '@typescript-eslint/no-unused-vars',
        '@typescript-eslint/no-explicit-any',
        'react-hooks/incompatible-library',
        'react-hooks/refs',
        'react-hooks/set-state-in-effect',
        'react-hooks/use-memo',
        'react-hooks/exhaustive-deps',
        'jsx-a11y/click-events-have-key-events',
        'jsx-a11y/no-static-element-interactions',
        'jsx-a11y/no-noninteractive-element-interactions',
        'jsx-a11y/no-autofocus',
        'no-irregular-whitespace'
      ].map(rule => [rule, 'warn'])
    )
  },
  {
    // Tests and fixtures render fixed English fixtures and use loose mocks.
    files: ['**/*.test.{ts,tsx}', 'src/test/**', '**/test-utils.tsx', '**/fixtures/**'],
    rules: {
      'local/no-literal-text': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
