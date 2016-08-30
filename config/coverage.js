// Configuration for ember-cli-code-coverage
module.exports = {
  coverageEnvVar: 'COVERAGE',
  reporters: ['lcov', 'html'],
  excludes: [],
  coverageFolder: process.env.COVERAGE_DIR || 'coverage',
  useBabelInstrumenter: false
};
