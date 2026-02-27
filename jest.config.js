module.exports = {
  displayName: 'extension',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/extension'],
  testMatch: ['**/tests/extension/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/extension/setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  collectCoverageFrom: [
    'extension/js/**/*.js',
    '!extension/js/**/*.test.js'
  ]
};
