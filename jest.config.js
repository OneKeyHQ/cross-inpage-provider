module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^lodash-es$': '<rootDir>/node_modules/lodash',
    '^@onekeyfe/cross-inpage-provider-core$': '<rootDir>/packages/core/src/index.ts',
    '^@onekeyfe/extension-bridge-injected$':
      '<rootDir>/packages/extension/extension-bridge-injected/src',
    '^@onekeyfe/cross-inpage-provider-events$': '<rootDir>/packages/events/cross-events.js',
    '^@onekeyfe/cross-inpage-provider-errors$': '<rootDir>/packages/errors/src/index.ts',
    '^@onekeyfe/cross-inpage-provider-types$': '<rootDir>/packages/types/src/index.ts',
    '^@onekeyfe/(.*)$': '<rootDir>/packages/$1/src',
  },
  testPathIgnorePatterns: [
    '/inpage-providers-hub/.*/universal/',
    '/node_modules/',
    '/__tests__/fixtures/',
    '/dist/',
  ],
};
