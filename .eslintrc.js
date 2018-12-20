module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  plugins: [
    'ember'
  ],
  extends: [
    'screwdriver',
    'plugin:ember/recommended'
  ],
  env: {
    browser: true
  },
  globals: {
    AnsiUp: true,
    humanizeDuration: true
  },
  rules: {
    indent: ['error', 2],
    'no-underscore-dangle': 'off',
    'prefer-const': 'off',
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    'import/no-mutable-exports': 'off',
    'import/newline-after-import': 'off',
    'ember/avoid-leaking-state-in-ember-objects': 'off',
    'ember/jquery-ember-run': 'off',
    'ember/no-global-jquery': 'off',
    'ember/no-side-effects': 'off'
  },
  overrides: [
    // node files
    {
      files: [
        'testem.js',
        'ember-cli-build.js',
        'config/**/*.js',
        'lib/*/index.js'
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2015
      },
      env: {
        browser: false,
        node: true
      }
    },

    // test files
    {
      files: ['tests/**/*.js'],
      excludedFiles: ['tests/dummy/**/*.js'],
      env: {
        embertest: true
      },
      rules: {
        'func-names': 'off',
        'prefer-arrow-callback': 'off'
      }
    }
  ]
};
