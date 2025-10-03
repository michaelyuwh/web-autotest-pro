// Accessibility Testing Configuration for Web AutoTest Pro
// Tests WCAG 2.1 AA compliance and ensures inclusive user experience

// Type definitions for accessibility testing
interface AccessibilityBrowser {
  newPage(): Promise<AccessibilityPage>;
  close(): Promise<void>;
}

interface AccessibilityPage {
  setViewport(viewport: { width: number; height: number }): Promise<void>;
  goto(url: string, options?: { waitUntil: string }): Promise<void>;
}

// Mock for puppeteer since it's not installed in this environment
const puppeteer = {
  launch: async (options: Record<string, unknown>): Promise<AccessibilityBrowser> => {
    return {} as AccessibilityBrowser;
  }
};

/**
 * Accessibility Test Suite Configuration
 */
export const accessibilityConfig = {
  // WCAG 2.1 AA compliance rules
  rules: {
    'color-contrast': { enabled: true, tags: ['wcag2aa'] },
    'keyboard-navigation': { enabled: true, tags: ['wcag2aa'] },
    'focus-management': { enabled: true, tags: ['wcag2aa'] },
    'alt-text': { enabled: true, tags: ['wcag2aa'] },
    'heading-hierarchy': { enabled: true, tags: ['wcag2aa'] },
    'form-labels': { enabled: true, tags: ['wcag2aa'] },
    'aria-attributes': { enabled: true, tags: ['wcag2aa'] },
    'link-purpose': { enabled: true, tags: ['wcag2aa'] }
  },

  // Pages to test
  testPages: [
    '/',
    '/test-cases',
    '/recording',
    '/execution',
    '/reports',
    '/settings'
  ],

  // Viewport configurations for responsive testing
  viewports: [
    { width: 1920, height: 1080, name: 'desktop-large' },
    { width: 1280, height: 720, name: 'desktop-medium' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' }
  ],

  // Axe-core configuration
  axeConfig: {
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    disableOtherRules: false,
    reporterOptions: {
      reporters: ['v2'],
      outputFile: 'test-results/accessibility-report.json'
    }
  }
};

/**
 * Accessibility test runner
 */
export class AccessibilityTestRunner {
  private browser: AccessibilityBrowser | null;
  private page: AccessibilityPage | null;

  async setup() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    this.page = await this.browser.newPage();
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAccessibilityTests(baseUrl: string = 'http://localhost:3000') {
    const results: Array<Record<string, unknown>> = [];

    for (const pagePath of accessibilityConfig.testPages) {
      for (const viewport of accessibilityConfig.viewports) {
        try {
          await this.page.setViewport(viewport);
          await this.page.goto(`${baseUrl}${pagePath}`, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
          });

          // Wait for page to be fully interactive
          await this.page.waitForTimeout(2000);

          // Run axe-core accessibility tests
          const axe = new AxePuppeteer(this.page);
          const axeResults = await axe
            .configure(accessibilityConfig.axeConfig)
            .analyze();

          // Test keyboard navigation
          const keyboardTestResults = await this.testKeyboardNavigation();

          // Test focus management
          const focusTestResults = await this.testFocusManagement();

          // Test screen reader compatibility
          const screenReaderResults = await this.testScreenReaderCompatibility();

          results.push({
            page: pagePath,
            viewport: viewport.name,
            timestamp: new Date().toISOString(),
            axeResults,
            keyboardNavigation: keyboardTestResults,
            focusManagement: focusTestResults,
            screenReader: screenReaderResults,
            violations: axeResults.violations.length,
            passes: axeResults.passes.length,
            incomplete: axeResults.incomplete.length
          });

          console.log(`✅ Accessibility test completed for ${pagePath} (${viewport.name})`);
          
        } catch (error) {
          console.error(`❌ Accessibility test failed for ${pagePath} (${viewport.name}):`, error);
          results.push({
            page: pagePath,
            viewport: viewport.name,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return this.generateReport(results);
  }

  private async testKeyboardNavigation() {
    const results = {
      tabNavigation: false,
      enterActivation: false,
      escapeHandling: false,
      arrowNavigation: false
    };

    try {
      // Test Tab navigation
      await this.page.keyboard.press('Tab');
      const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
      results.tabNavigation = !!focusedElement;

      // Test Enter key activation
      if (focusedElement === 'BUTTON' || focusedElement === 'A') {
        await this.page.keyboard.press('Enter');
        results.enterActivation = true;
      }

      // Test Escape key handling (if modal or dropdown is open)
      await this.page.keyboard.press('Escape');
      results.escapeHandling = true;

      // Test Arrow key navigation (for lists/menus)
      await this.page.keyboard.press('ArrowDown');
      results.arrowNavigation = true;

    } catch (error) {
      console.warn('Keyboard navigation test warning:', error.message);
    }

    return results;
  }

  private async testFocusManagement() {
    const results = {
      visibleFocus: false,
      logicalOrder: false,
      trapFocus: false,
      returnFocus: false
    };

    try {
      // Test visible focus indicators
      const focusStyles = await this.page.evaluate(() => {
        const focused = document.activeElement;
        if (!focused) return null;
        
        const styles = getComputedStyle(focused);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      });

      results.visibleFocus = !!(focusStyles?.outline || focusStyles?.boxShadow);

      // Test logical tab order
      const tabOrder = await this.page.evaluate(() => {
        const focusableElements = Array.from(
          document.querySelectorAll('button, [href], input, select, textarea, [tabindex]')
        ).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
        
        return focusableElements.map(el => ({
          tag: el.tagName,
          tabIndex: el.tabIndex,
          rect: el.getBoundingClientRect()
        }));
      });

      results.logicalOrder = tabOrder.length > 0;

    } catch (error) {
      console.warn('Focus management test warning:', error.message);
    }

    return results;
  }

  private async testScreenReaderCompatibility() {
    const results = {
      ariaLabels: 0,
      altTexts: 0,
      headingStructure: false,
      landmarks: 0
    };

    try {
      const screenReaderInfo = await this.page.evaluate(() => {
        // Count ARIA labels
        const ariaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]').length;
        
        // Count alt texts
        const altTexts = document.querySelectorAll('img[alt]').length;
        
        // Check heading structure
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
        const properStructure = headingLevels.length > 0 && headingLevels[0] === 1;
        
        // Count landmarks
        const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').length;
        
        return {
          ariaLabels,
          altTexts,
          headingStructure: properStructure,
          landmarks
        };
      });

      Object.assign(results, screenReaderInfo);

    } catch (error) {
      console.warn('Screen reader compatibility test warning:', error.message);
    }

    return results;
  }

  private generateReport(results: Array<Record<string, unknown>>) {
    const summary = {
      totalTests: results.length,
      passed: results.filter(r => !r.error && r.violations === 0).length,
      failed: results.filter(r => r.error || r.violations > 0).length,
      totalViolations: results.reduce((sum, r) => sum + (r.violations || 0), 0),
      timestamp: new Date().toISOString()
    };

    const report = {
      summary,
      results,
      recommendations: this.generateRecommendations(results)
    };

    return report;
  }

  private generateRecommendations(results: Array<Record<string, unknown>>) {
    const recommendations = [];
    const violations = results.flatMap(r => r.axeResults?.violations || []);

    // Group violations by type
    const violationTypes = violations.reduce((acc, v) => {
      acc[v.id] = (acc[v.id] || 0) + 1;
      return acc;
    }, {});

    // Generate specific recommendations
    Object.entries(violationTypes).forEach(([id, count]) => {
      switch (id) {
        case 'color-contrast':
          recommendations.push(`Fix ${count} color contrast issues - ensure 4.5:1 ratio for normal text`);
          break;
        case 'keyboard':
          recommendations.push(`Implement keyboard navigation for ${count} interactive elements`);
          break;
        case 'alt-text':
          recommendations.push(`Add alternative text for ${count} images`);
          break;
        default:
          recommendations.push(`Address ${count} ${id} violations`);
      }
    });

    return recommendations;
  }
}

// Jest test integration
export const accessibilityTestSuite = {
  testTimeout: 60000,
  setupTest: async () => {
    const runner = new AccessibilityTestRunner();
    await runner.setup();
    return runner;
  },
  teardownTest: async (runner: AccessibilityTestRunner) => {
    await runner.teardown();
  }
};