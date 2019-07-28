module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [ "**/test/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)" ],
  testPathIgnorePatterns: [ "/node_modules/", "/test/helpers.ts" ],
  coveragePathIgnorePatterns: [ "/node_modules/", "/test/helpers.ts" ]
};
