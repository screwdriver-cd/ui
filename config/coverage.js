// Configuration for ember-cli-code-coverage
module.exports = {
  coverageEnvVar: 'COVERAGE',
  reporters: ['lcov'],
  coverageFolder: process.env.COVERAGE_DIR || 'coverage',
  useBabelInstrumenter: true
};
