/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/test/react-native.mock.tsx',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};
