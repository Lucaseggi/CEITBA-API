const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),
  collectCoverageFrom: [
    'ddd-src/**/*.(t|j)s',
    '!ddd-src/boot/main.ts',
    '!ddd-src/**/*.spec.ts',
    '!ddd-src/**/*.dto.ts',
    '!ddd-src/**/*.interface.ts',
    '!ddd-src/**/*.module.ts',
    '!ddd-src/**/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 10,
      functions: 10,
      lines: 10,
    },
  },
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
};