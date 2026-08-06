const rootConfig = require('../../jest.config.js');

module.exports = {
  ...rootConfig,
  rootDir: '../..',
  testMatch: [
    '<rootDir>/packages/connect-button-workbench/dapps/**/adapter.test.ts',
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
