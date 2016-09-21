module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  extends: 'screwdriver',
  env: {
    'browser': true
  },
  globals: {
    "ansi_up": true,
    "humanizeDuration": true
  },
  rules: {
    indent: ['error', 2],
    'no-underscore-dangle': 'off',
    'prefer-const': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    'import/no-mutable-exports': 'off',
    'import/newline-after-import': 'off'
  }
};
