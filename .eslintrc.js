module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  extends: 'screwdriver',
  plugins: ['ember'],
  env: {
    browser: true
  },
  globals: {
    ansi_up: true,
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
    "ember/alias-model-in-controller": "off",
    "ember/avoid-leaking-state-in-components": "off",
    "ember/closure-actions": "error",
    "ember/jquery-ember-run": "off",
    "ember/local-modules": "off",
    "ember/named-functions-in-promises": "off",
    "ember/new-module-imports": "off",
    "ember/no-attrs-in-components": "off",
    "ember/no-attrs-snapshot": "error",
    "ember/no-capital-letters-in-routes": "error",
    "ember/no-duplicate-dependent-keys": "off",
    "ember/no-empty-attrs": "off",
    "ember/no-function-prototype-extensions": "error",
    "ember/no-global-jquery": "off",
    "ember/no-jquery": "off",
    "ember/no-observers": "off",
    "ember/no-old-shims": "off",
    "ember/no-on-calls-in-components": "error",
    "ember/no-side-effects": "error",
    "ember/order-in-components": "error",
    "ember/order-in-controllers": "error",
    "ember/order-in-models": "error",
    "ember/order-in-routes": "error",
    "ember/require-super-in-init": "off",
    "ember/routes-segments-snake-case": "error",
    "ember/use-brace-expansion": "error",
    "ember/use-ember-get-and-set": "off"
  }
};
