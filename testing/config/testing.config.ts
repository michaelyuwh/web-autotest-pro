// Centralized Testing Configuration for Web AutoTest Pro
// This file consolidates all testing configurations and utilities

import { Page } from 'playwright';

export const testingConfig = {
  // Common test directories
  directories: {
    unit: './testing/unit',
    integration: './testing/integration',
    e2e: './testing/e2e',
    fixtures: './testing/fixtures',
    results: './test-results',
    coverage: './coverage'
  },

  // Environment settings
  environments: {
    development: {
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3001/api',
      timeout: 30000
    },
    staging: {
      baseUrl: 'https://staging.webautotestpro.com',
      apiUrl: 'https://staging-api.webautotestpro.com',
      timeout: 60000
    },
    production: {
      baseUrl: 'https://webautotestpro.com',
      apiUrl: 'https://api.webautotestpro.com',
      timeout: 60000
    }
  },

  // Browser configurations
  browsers: {
    chrome: {
      name: 'chromium',
      viewport: { width: 1280, height: 720 },
      options: {
        headless: process.env.CI === 'true',
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      }
    },
    firefox: {
      name: 'firefox',
      viewport: { width: 1280, height: 720 },
      options: {
        headless: process.env.CI === 'true'
      }
    },
    safari: {
      name: 'webkit',
      viewport: { width: 1280, height: 720 },
      options: {
        headless: process.env.CI === 'true'
      }
    }
  },

  // Test data patterns
  testData: {
    users: {
      admin: {
        username: 'admin@webautotestpro.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'testpass123'
      },
      user: {
        username: 'user@webautotestpro.com',
        password: process.env.TEST_USER_PASSWORD || 'testpass123'
      }
    },
    urls: {
      login: '/login',
      dashboard: '/dashboard',
      testCases: '/test-cases',
      reports: '/reports'
    }
  },

  // Performance thresholds
  performance: {
    pageLoad: 3000, // 3 seconds
    apiResponse: 1000, // 1 second
    bundleSize: 2048000, // 2MB
    lighthouse: {
      performance: 90,
      accessibility: 95,
      bestPractices: 90,
      seo: 90
    }
  },

  // Accessibility standards
  accessibility: {
    standard: 'WCAG21AA',
    rules: {
      'color-contrast': 'error',
      'keyboard-navigation': 'error',
      'screen-reader': 'error',
      'focus-management': 'error'
    }
  },

  // Visual regression settings
  visualRegression: {
    threshold: 0.2, // 20% difference threshold
    updateBaselines: process.env.UPDATE_VISUAL_BASELINES === 'true',
    browsers: ['chrome', 'firefox'],
    viewports: [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ]
  },

  // Security testing
  security: {
    owasp: {
      enabled: true,
      level: 'medium',
      excludeRules: []
    },
    csp: {
      enforced: true,
      reportOnly: false
    },
    https: {
      required: process.env.NODE_ENV === 'production'
    }
  }
};

// Test utilities
export const testUtils = {
  // Wait for element to be visible and stable
  waitForStableElement: async (page: Page, selector: string, timeout = 5000) => {
    await page.waitForSelector(selector, { timeout });
    await page.waitForFunction(
      (sel: string) => {
        const element = document.querySelector(sel);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      },
      selector,
      { timeout }
    );
  },

  // Generate test data
  generateTestData: (template: Record<string, unknown>) => {
    const timestamp = Date.now();
    return {
      ...template,
      id: `test-${timestamp}`,
      name: `Test Case ${timestamp}`,
      createdAt: new Date().toISOString()
    };
  },

  // Screenshot utilities
  captureScreenshot: async (page: Page, name: string) => {
    const screenshot = await page.screenshot({
      path: `${testingConfig.directories.results}/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
    return screenshot;
  },

  // API testing helpers
  apiRequest: async (endpoint: string, options: RequestInit = {}) => {
    const env = (process.env.NODE_ENV || 'development') as keyof typeof testingConfig.environments;
    const baseUrl = testingConfig.environments[env].apiUrl;
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return response;
  },

  // Database cleanup
  cleanupTestData: async () => {
    // Implementation for cleaning up test data
    console.log('Cleaning up test data...');
  },

  // Performance measurement
  measurePerformance: async (page: Page, action: () => Promise<void>) => {
    const startTime = Date.now();
    await action();
    const endTime = Date.now();
    
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    return {
      executionTime: endTime - startTime,
      ...metrics
    };
  }
};

// Export common test fixtures
export const fixtures = {
  testCase: {
    id: 'test-case-1',
    name: 'Sample Test Case',
    description: 'A sample test case for demonstration',
    steps: [
      { action: 'navigate', url: 'https://example.com' },
      { action: 'click', selector: '#login-button' },
      { action: 'type', selector: '#username', value: 'testuser' },
      { action: 'type', selector: '#password', value: 'testpass' },
      { action: 'click', selector: '#submit' }
    ],
    assertions: [
      { type: 'url', condition: 'contains', value: '/dashboard' },
      { type: 'element', selector: '.welcome-message', condition: 'visible' }
    ]
  },

  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user'
  },

  execution: {
    id: 'execution-1',
    testCaseId: 'test-case-1',
    status: 'running',
    startTime: new Date().toISOString(),
    browser: 'chrome',
    viewport: { width: 1280, height: 720 }
  }
};

export default testingConfig;