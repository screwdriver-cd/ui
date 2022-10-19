'use strict';

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true
    }
  },
  plugins: ['ember', 'prettier'],
  extends: [
    'screwdriver',
    'plugin:ember/recommended',
    'plugin:prettier/recommended',
    'prettier' // last one wins
  ],
  env: {
    browser: true
  },
  globals: {
    AnsiUp: true,
    humanizeDuration: true
  },
  rules: {
    'no-underscore-dangle': 'off',
    'prefer-const': 'off',
    'prefer-destructuring': [
      'warn',
      {
        VariableDeclarator: {
          array: false,
          object: true
        },
        AssignmentExpression: {
          array: false,
          object: true
        }
      },
      {
        enforceForRenamedProperties: false
      }
    ],
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    'import/no-mutable-exports': 'off',
    'import/newline-after-import': 'off',
    'ember/avoid-leaking-state-in-ember-objects': 'off',
    'ember/jquery-ember-run': 'off',
    'ember/no-global-jquery': 'off',
    'ember/no-jquery': 'off',
    'ember/no-new-mixins': 'off',
    'ember/no-observers': 'off',
    'ember/no-side-effects': 'off',
    'ember/no-arrow-function-computed-properties': [
      'error',
      { onlyThisContexts: true }
    ],
    'max-lines-per-function': ['warn', { max: 1500, skipComments: true }],
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true
      }
    ]
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        'testem.js',
        'blueprints/*/index.js',
        'config/**/*.js',
        'lib/*/index.js',
        'server/**/*.js'
      ],
      parserOptions: {
        sourceType: 'script'
      },
      env: {
        browser: false,
        node: true
      },
      // plugins: ['node'],
      // extends: ['plugin:node/recommended'],
      rules: {
        // this can be removed once the following is fixed
        // https://github.com/mysticatea/eslint-plugin-node/issues/77
        // 'node/no-unpublished-require': 'off',
        'func-names': 'off'
      }
    },

    // test files
    {
      files: ['tests/**/*.js'],
      excludedFiles: ['tests/dummy/**/*.js'],
      env: {
        browser: true,
        node: true
      },
      rules: {
        'func-names': 'off',
        'prefer-arrow-callback': 'off'
      }
    }
  ]
};
