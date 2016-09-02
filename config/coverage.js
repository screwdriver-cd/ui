// Configuration for ember-cli-code-coverage
module.exports = {
  coverageEnvVar: 'COVERAGE',
  reporters: ['lcov', 'html'],
  // Templates are pre-compiled from hbs to js, so istanbul sees them as template.js
  // We have no desire to get full coverage on handlebars code, so exclude them
  // This is supposed to be done by ember-cli-code-coverage automatically, but doesn't work
  excludes: ['*/components/**/template.js'],
  coverageFolder: process.env.COVERAGE_DIR || 'coverage',
  useBabelInstrumenter: false
};
