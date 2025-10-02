// Jest Configuration for Web AutoTest Pro
// Unit testing configuration for React and TypeScript components

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/testing/unit/setup/jest.setup.ts'],
  
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/web-app/src/$1',
    '^@components/(.*)$': '<rootDir>/web-app/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/web-app/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/web-app/src/utils/$1',
    '^@services/(.*)$': '<rootDir>/web-app/src/services/$1',
    '^@types/(.*)$': '<rootDir>/web-app/src/types/$1',
    '^@assets/(.*)$': '<rootDir>/web-app/src/assets/$1',
  },
  
  // File extensions to handle
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files with TypeScript and Babel
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Files to ignore during transformation
  transformIgnorePatterns: [
    'node_modules/(?!(react-syntax-highlighter|@babel|uuid)/)',
  ],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/testing/unit/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/testing/unit/**/*.spec.(ts|tsx|js|jsx)',
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'web-app/src/**/*.{ts,tsx}',
    'browser-extension/src/**/*.{ts,tsx,js}',
    'android-app/web-autotest-companion/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/*.stories.{ts,tsx}',
    '!**/*.config.{ts,js}',
    '!**/coverage/**',
  ],
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage output directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './web-app/src/components/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './web-app/src/hooks/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Mock static assets
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/testing/unit/mocks/fileMock.js',
  },
  
  // Global setup and teardown
  globalSetup: '<rootDir>/testing/unit/setup/global-setup.ts',
  globalTeardown: '<rootDir>/testing/unit/setup/global-teardown.ts',
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Notify of test results
  notify: true,
  
  // Notification mode
  notifyMode: 'failure-change',
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
        suiteName: 'Web AutoTest Pro Unit Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/test-results',
        filename: 'unit-test-report.html',
        expand: true,
        hideIcon: false,
      },
    ],
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/web-app/src'],
  
  // Preset for TypeScript and React
  preset: 'ts-jest/presets/js-with-ts',
  
  // Globals for ts-jest
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
  
  // ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};