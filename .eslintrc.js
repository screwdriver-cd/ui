module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['ember', 'prettier'],
  extends: ['screwdriver', 'prettier', 'plugin:ember/recommended'],
  env: {
    browser: true
  },
  globals: {
    AnsiUp: true,
    humanizeDuration: true
  },
  rules: {
    indent: ['error', 2, { SwitchCase: 1 }],
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
    'ember/no-side-effects': 'off',
    'prettier/prettier': 'error'
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
      env: {
        browser: false,
        node: true
      },
      rules: {
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
