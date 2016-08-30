module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  extends: 'airbnb-base',
  env: {
    'browser': true
  },
  globals: {
    "ansi_up": true
  },
  rules: {
    'comma-dangle': ['error', 'never'],
    indent: ['error', 2],
    'max-len': ['error', { code: 100, ignoreComments: true }],
    'new-cap': ['error'],
    'newline-after-var': ['error', 'always'],
    'newline-before-return': 'error',
    'no-bitwise': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-param-reassign': ['error', { props: false }],
    'no-underscore-dangle': 'off',
    'prefer-const': 'off',
    'prefer-rest-params': 'off',
    'prefer-spread': 'off',
    'require-jsdoc': ['error', {
        require: {
            FunctionDeclaration: true,
            MethodDefinition: false,
            ClassDeclaration: false
        }
    }],
    strict: ['error', 'safe'],
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    'import/no-mutable-exports': 'off',
    'import/newline-after-import': 'off'
  }
};
