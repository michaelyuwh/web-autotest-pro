import { TestCase, ActionType } from '@web-autotest-pro/shared';

// Example test cases for demonstration
export const sampleTestCases: TestCase[] = [
  {
    id: 'test-1',
    name: 'Google Search Test',
    description: 'Search for "Web AutoTest Pro" on Google',
    url: 'https://www.google.com',
    tags: ['search', 'google', 'demo'],
    steps: [
      {
        id: 'step-1',
        type: ActionType.NAVIGATE,
        selector: '',
        url: 'https://www.google.com',
        timestamp: Date.now(),
        description: 'Navigate to Google homepage'
      },
      {
        id: 'step-2',
        type: ActionType.WAIT,
        selector: 'input[name="q"]',
        timestamp: Date.now(),
        description: 'Wait for search input to be visible'
      },
      {
        id: 'step-3',
        type: ActionType.TYPE,
        selector: 'input[name="q"]',
        value: 'Web AutoTest Pro',
        timestamp: Date.now(),
        description: 'Type search query'
      },
      {
        id: 'step-4',
        type: ActionType.KEY_PRESS,
        selector: '',
        value: 'Enter',
        timestamp: Date.now(),
        description: 'Press Enter to search'
      },
      {
        id: 'step-5',
        type: ActionType.WAIT,
        selector: '#search',
        timestamp: Date.now(),
        description: 'Wait for search results'
      },
      {
        id: 'step-6',
        type: ActionType.ASSERT,
        selector: '#search',
        timestamp: Date.now(),
        description: 'Verify search results are visible',
        assertion: {
          type: 'visible',
          value: 'true'
        }
      }
    ],
    actions: [], // Will be populated by getter
    successCriteria: [
      {
        id: 'criteria-1',
        type: 'element_exists',
        selector: '#search',
        expectedValue: 'Search results container exists',
        description: 'Search results should be visible'
      }
    ],
    metadata: {
      author: 'Web AutoTest Pro',
      browser: 'chromium',
      deviceType: 'desktop',
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 3600000,  // 1 hour ago
    version: 1
  },
  {
    id: 'test-2',
    name: 'GitHub Login Test',
    description: 'Test GitHub login page elements',
    url: 'https://github.com/login',
    tags: ['github', 'login', 'demo'],
    steps: [
      {
        id: 'step-1',
        type: ActionType.NAVIGATE,
        selector: '',
        url: 'https://github.com/login',
        timestamp: Date.now(),
        description: 'Navigate to GitHub login'
      },
      {
        id: 'step-2',
        type: ActionType.WAIT,
        selector: '#login_field',
        timestamp: Date.now(),
        description: 'Wait for username field'
      },
      {
        id: 'step-3',
        type: ActionType.ASSERT,
        selector: '#login_field',
        timestamp: Date.now(),
        description: 'Verify username field is visible',
        assertion: {
          type: 'visible',
          value: 'true'
        }
      },
      {
        id: 'step-4',
        type: ActionType.ASSERT,
        selector: '#password',
        timestamp: Date.now(),
        description: 'Verify password field is visible',
        assertion: {
          type: 'visible',
          value: 'true'
        }
      },
      {
        id: 'step-5',
        type: ActionType.ASSERT,
        selector: 'input[type="submit"]',
        timestamp: Date.now(),
        description: 'Verify submit button is visible',
        assertion: {
          type: 'visible',
          value: 'true'
        }
      }
    ],
    actions: [], // Will be populated by getter
    successCriteria: [
      {
        id: 'criteria-1',
        type: 'element_exists',
        selector: '#login_field',
        expectedValue: 'Username field exists',
        description: 'Login form should be visible'
      }
    ],
    metadata: {
      author: 'Web AutoTest Pro',
      browser: 'chromium',
      deviceType: 'desktop',
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    createdAt: Date.now() - 43200000, // 12 hours ago
    updatedAt: Date.now() - 1800000,  // 30 minutes ago
    version: 1
  },
  {
    id: 'test-3',
    name: 'React Documentation Test',
    description: 'Navigate React docs and verify navigation',
    url: 'https://react.dev',
    tags: ['react', 'documentation', 'navigation'],
    steps: [
      {
        id: 'step-1',
        type: ActionType.NAVIGATE,
        selector: '',
        url: 'https://react.dev',
        timestamp: Date.now(),
        description: 'Navigate to React documentation'
      },
      {
        id: 'step-2',
        type: ActionType.WAIT,
        selector: 'nav',
        timeout: 5000,
        timestamp: Date.now(),
        description: 'Wait for navigation menu'
      },
      {
        id: 'step-3',
        type: ActionType.CLICK,
        selector: 'a[href="/learn"]',
        timestamp: Date.now(),
        description: 'Click on Learn section'
      },
      {
        id: 'step-4',
        type: ActionType.WAIT,
        selector: 'h1',
        timeout: 5000,
        timestamp: Date.now(),
        description: 'Wait for page to load'
      },
      {
        id: 'step-5',
        type: ActionType.ASSERT,
        selector: 'h1',
        timestamp: Date.now(),
        description: 'Verify Learn page title',
        assertion: {
          type: 'text',
          value: 'Quick Start'
        }
      }
    ],
    actions: [], // Will be populated by getter
    successCriteria: [
      {
        id: 'criteria-1',
        type: 'url_matches',
        expectedValue: 'https://react.dev/learn',
        description: 'Should navigate to learn section'
      }
    ],
    metadata: {
      author: 'Web AutoTest Pro',
      browser: 'chromium',
      deviceType: 'desktop',
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    createdAt: Date.now() - 21600000, // 6 hours ago
    updatedAt: Date.now() - 900000,   // 15 minutes ago
    version: 1
  }
];

// Populate actions array for backward compatibility
sampleTestCases.forEach(testCase => {
  testCase.actions = testCase.steps;
});

export default sampleTestCases;