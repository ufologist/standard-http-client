module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  collectCoverage: true,
  coverageDirectory: 'coverage',

  // This option sets the URL for the jsdom environment. It is reflected in properties such as location.href
  testURL: 'http://localhost/',

  coverageReporters: ['lcov', 'json', 'json-summary', 'text'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: ['/node_modules/']
};