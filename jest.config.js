module.exports = {
  ...require('build-tools-jest'),
  ...require('build-tools-typescript-jest'),
  collectCoverageFrom: [ 'src/**/*.ts' ]
};
