// Playwright Executor - Uses shared types and proper Playwright integration
import { TestCase, TestAction, TestExecution, ExecutionStep, ExecutionStatus, ActionType, Screenshot } from '@web-autotest-pro/shared';
import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';

export interface ExecutionOptions {
  browser: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  slowMotion: number;
  timeout: number;
  screenshots: boolean;
  video: boolean;
  trace: boolean;
  viewport?: { width: number; height: number };
}

export class PlaywrightExecutor {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private options: ExecutionOptions;
  private currentExecution: TestExecution | null = null;

  constructor(options: ExecutionOptions) {
    this.options = {
      browser: options.browser || 'chromium',
      headless: options.headless ?? true,
      slowMotion: options.slowMotion ?? 0,
      timeout: options.timeout ?? 30000,
      screenshots: options.screenshots ?? true,
      video: options.video ?? false,
      trace: options.trace ?? false,
      viewport: options.viewport
    };
  }

  async initialize(): Promise<void> {
    try {
      console.log(`Initializing ${this.options.browser} browser...`);
      
      const browserOptions = {
        headless: this.options.headless,
        slowMo: this.options.slowMotion,
      };

      // Launch appropriate browser
      switch (this.options.browser) {
        case 'chromium':
          this.browser = await chromium.launch(browserOptions);
          break;
        case 'firefox':
          this.browser = await firefox.launch(browserOptions);
          break;
        case 'webkit':
          this.browser = await webkit.launch(browserOptions);
          break;
      }

      // Create browser context
      this.context = await this.browser.newContext({
        viewport: this.options.viewport || { width: 1280, height: 720 },
        recordVideo: this.options.video ? { dir: 'test-videos/' } : undefined,
      });

      // Create page
      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(this.options.timeout!);

      console.log('Browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async executeTestCase(testCase: TestCase): Promise<TestExecution> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const execution: TestExecution = {
      id: `exec_${Date.now()}`,
      testCaseId: testCase.id,
      status: ExecutionStatus.RUNNING,
      startTime: Date.now(),
      browser: this.options.browser,
      results: [],
      screenshots: [],
      logs: []
    };

    this.currentExecution = execution;

    try {
      console.log(`Starting execution of test case: ${testCase.name}`);
      
      // Navigate to initial URL if specified
      if (testCase.url) {
        await this.navigateToUrl(testCase.url);
        if (this.options.screenshots) {
          const screenshot = await this.takeScreenshot('initial-page');
          execution.screenshots.push({
            id: `screenshot_${Date.now()}`,
            stepId: 'initial',
            timestamp: Date.now(),
            data: screenshot,
            type: 'action'
          });
        }
      }

      // Execute each action
      for (let i = 0; i < testCase.actions.length; i++) {
        const action = testCase.actions[i];
        const step: ExecutionStep = {
          action,
          status: 'running'
        };

        // Add steps array if it doesn't exist
        if (!execution.steps) {
          execution.steps = [];
        }
        execution.steps.push(step);

        try {
          const startTime = Date.now();
          await this.executeAction(action);
          const duration = Date.now() - startTime;

          step.status = 'passed';
          step.duration = duration;

          if (this.options.screenshots) {
            const screenshot = await this.takeScreenshot(`step-${i + 1}`);
            step.screenshot = screenshot;
            execution.screenshots.push({
              id: `screenshot_${Date.now()}_${i}`,
              stepId: action.id,
              timestamp: Date.now(),
              data: screenshot,
              type: 'action'
            });
          }

          console.log(`✓ Step ${i + 1}: ${action.type} completed in ${duration}ms`);
        } catch (error) {
          step.status = 'failed';
          step.error = error instanceof Error ? error.message : 'Unknown error';
          
          console.error(`✗ Step ${i + 1}: ${action.type} failed:`, step.error);
          
          // Take screenshot on failure
          if (this.options.screenshots) {
            const screenshot = await this.takeScreenshot(`step-${i + 1}-failed`);
            step.screenshot = screenshot;
            execution.screenshots.push({
              id: `screenshot_${Date.now()}_${i}_failed`,
              stepId: action.id,
              timestamp: Date.now(),
              data: screenshot,
              type: 'error'
            });
          }

          // Decide whether to continue or stop execution
          if (action.critical !== false) {
            execution.status = ExecutionStatus.FAILED;
            break;
          }
        }
      }

      // Mark as completed if not already failed
      if (execution.status === ExecutionStatus.RUNNING) {
        execution.status = ExecutionStatus.COMPLETED;
      }

    } catch (error) {
      execution.status = ExecutionStatus.FAILED;
      execution.error = error instanceof Error ? error.message : 'Unknown execution error';
      console.error('Test execution failed:', execution.error);
    } finally {
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
    }

    return execution;
  }

  private async executeAction(action: TestAction): Promise<void> {
    if (!this.page) throw new Error('Page not available');

    switch (action.type) {
      case ActionType.NAVIGATE:
        await this.navigateToUrl(action.url!);
        break;

      case ActionType.CLICK:
        await this.page.click(action.selector!, { timeout: this.options.timeout });
        break;

      case ActionType.TYPE:
        await this.page.fill(action.selector!, action.value || '');
        break;

      case ActionType.HOVER:
        await this.page.hover(action.selector!, { timeout: this.options.timeout });
        break;

      case ActionType.WAIT:
        if (action.selector) {
          await this.page.waitForSelector(action.selector, { timeout: this.options.timeout });
        } else {
          await this.page.waitForTimeout(action.value ? parseInt(action.value) : 1000);
        }
        break;

      case ActionType.SCROLL:
        if (action.selector) {
          await this.page.locator(action.selector).scrollIntoViewIfNeeded();
        } else {
          await this.page.evaluate(({ x, y }) => {
            window.scrollTo(x || 0, y || 0);
          }, { x: action.x, y: action.y });
        }
        break;

      case ActionType.ASSERT:
        await this.executeAssertion(action);
        break;

      case ActionType.KEY_PRESS:
        await this.page.keyboard.press(action.value || 'Enter');
        break;

      default:
        console.warn(`Unsupported action type: ${action.type}`);
    }

    // Wait a bit after each action for stability
    await this.page.waitForTimeout(100);
  }

  private async executeAssertion(action: TestAction): Promise<void> {
    if (!this.page) throw new Error('Page not available');

    switch (action.assertion?.type) {
      case 'visible':
        await this.page.waitForSelector(action.selector!, { state: 'visible', timeout: this.options.timeout });
        break;

      case 'hidden':
        await this.page.waitForSelector(action.selector!, { state: 'hidden', timeout: this.options.timeout });
        break;

      case 'text':
        const element = this.page.locator(action.selector!);
        await element.waitFor({ timeout: this.options.timeout });
        const text = await element.textContent();
        if (text !== action.assertion.value) {
          throw new Error(`Expected text "${action.assertion.value}", but got "${text}"`);
        }
        break;

      case 'value':
        const input = this.page.locator(action.selector!);
        await input.waitFor({ timeout: this.options.timeout });
        const value = await input.inputValue();
        if (value !== action.assertion.value) {
          throw new Error(`Expected value "${action.assertion.value}", but got "${value}"`);
        }
        break;

      case 'count':
        const elements = this.page.locator(action.selector!);
        const count = await elements.count();
        if (count !== parseInt(action.assertion.value || '0')) {
          throw new Error(`Expected ${action.assertion.value} elements, but found ${count}`);
        }
        break;

      default:
        console.warn(`Unsupported assertion type: ${action.assertion?.type}`);
    }
  }

  private async navigateToUrl(url: string): Promise<void> {
    if (!this.page) throw new Error('Page not available');
    
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: this.options.timeout });
  }

  private async takeScreenshot(name: string): Promise<string> {
    if (!this.page) throw new Error('Page not available');
    
    const timestamp = Date.now();
    const filename = `screenshot-${name}-${timestamp}.png`;
    const path = `test-screenshots/${filename}`;
    
    await this.page.screenshot({ path, fullPage: true });
    return path;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      
      console.log('Browser cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  async getPageInfo(): Promise<{ title: string; url: string; userAgent: string }> {
    if (!this.page) throw new Error('Page not available');
    
    return {
      title: await this.page.title(),
      url: this.page.url(),
      userAgent: await this.page.evaluate(() => navigator.userAgent)
    };
  }
}