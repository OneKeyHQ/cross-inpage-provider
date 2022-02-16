module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@onekeyfe/(.*)$': '<rootDir>/packages/$1/src',
  },
}
