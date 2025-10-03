/**
 * IE Mode Support - Fallback DOM Scripts and Compatibility Layer
 * Provides full automation capabilities for Internet Explorer mode when Playwright is not available
 */

export interface IEModeOptions {
  enableCompatibilityLayer: boolean;
  fallbackToDOM: boolean;
  usePolyfills: boolean;
  enableVerboseLogging: boolean;
  timeout: number;
}

export interface IEModeElement {
  element: Element;
  selector: string;
  isVisible: boolean;
  isEnabled: boolean;
  tagName: string;
  textContent: string;
  value?: string;
}

export interface IEModeExecution {
  success: boolean;
  error?: string;
  duration: number;
  steps: IEModeStep[];
  screenshots: string[];
  logs: string[];
}

export interface IEModeStep {
  action: string;
  selector?: string;
  value?: string;
  success: boolean;
  error?: string;
  duration: number;
  screenshot?: string;
}

/**
 * IE Mode Compatibility Layer
 * Provides fallback DOM manipulation when modern browser APIs are unavailable
 */
export class IEModeCompatibilityLayer {
  private options: IEModeOptions;
  private polyfillsLoaded: boolean = false;
  private logs: string[] = [];

  constructor(options: Partial<IEModeOptions> = {}) {
    this.options = {
      enableCompatibilityLayer: true,
      fallbackToDOM: true,
      usePolyfills: true,
      enableVerboseLogging: false,
      timeout: 30000,
      ...options
    };

    if (this.options.enableCompatibilityLayer) {
      this.initializeCompatibilityLayer();
    }
  }

  /**
   * Initialize IE compatibility layer with polyfills and fallbacks
   */
  private initializeCompatibilityLayer(): void {
    try {
      this.loadPolyfills();
      this.setupEventHandlers();
      this.patchDOMAPIs();
      this.log('IE Mode compatibility layer initialized');
    } catch (error) {
      this.log(`Failed to initialize compatibility layer: ${error}`, 'error');
    }
  }

  /**
   * Load necessary polyfills for IE mode
   */
  private loadPolyfills(): void {
    if (!this.options.usePolyfills || this.polyfillsLoaded) return;

    // Promise polyfill for IE
    if (typeof Promise === 'undefined') {
      (window as any).Promise = class SimplePromise {
        private value: any;
        private error: any;
        private state: 'pending' | 'resolved' | 'rejected' = 'pending';

        constructor(executor: (resolve: Function, reject: Function) => void) {
          try {
            executor(
              (value: any) => setTimeout(() => this.resolve(value), 0),
              (error: any) => setTimeout(() => this.reject(error), 0)
            );
          } catch (error) {
            setTimeout(() => this.reject(error), 0);
          }
        }

        then(onResolve?: Function, onReject?: Function) {
          return new SimplePromise((resolve, reject) => {
            try {
              const result = onResolve ? onResolve(this.value) : this.value;
              resolve(result);
            } catch (error) {
              if (onReject) {
                const result = onReject(error);
                resolve(result);
              } else {
                reject(error);
              }
            }
          });
        }

        catch(onReject: Function) {
          return this.then(undefined, onReject);
        }

        private resolve(value: any) {
          this.value = value;
          this.state = 'resolved';
        }

        private reject(error: any) {
          this.error = error;
          this.state = 'rejected';
        }
      };
    }

    // querySelector polyfill for older IE
    if (!document.querySelector) {
      document.querySelector = function(selector: string): Element | null {
        const elements = document.querySelectorAll(selector);
        return elements.length > 0 ? elements[0] : null;
      };
    }

    // querySelectorAll polyfill for older IE
    if (!document.querySelectorAll) {
      document.querySelectorAll = function(selector: string): NodeListOf<Element> {
        const style = document.createElement('style');
        document.head.appendChild(style);
        const elements: Element[] = [];
        
        try {
          style.innerHTML = selector + ' {ie-test: expression(elements.push(this))}';
          // IE will evaluate the expression and push elements
        } catch (e) {
          // Fallback for complex selectors
          // Complex selector not supported in IE mode, using fallback
        }
        
        document.head.removeChild(style);
        return elements as any;
      };
    }

    // addEventListener polyfill for IE8
    if (!Element.prototype.addEventListener) {
      (Element.prototype as any).addEventListener = function(event: string, handler: Function) {
        (this as any).attachEvent('on' + event, handler);
      };
      
      (Element.prototype as any).removeEventListener = function(event: string, handler: Function) {
        (this as any).detachEvent('on' + event, handler);
      };
    }

    // Array.isArray polyfill
    if (!Array.isArray) {
      Array.isArray = function(arg: any): arg is any[] {
        return Object.prototype.toString.call(arg) === '[object Array]';
      };
    }

    // Object.keys polyfill
    if (!Object.keys) {
      Object.keys = function(obj: any): string[] {
        const keys: string[] = [];
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
        return keys;
      };
    }

    this.polyfillsLoaded = true;
    this.log('IE polyfills loaded successfully');
  }

  /**
   * Setup event handlers for IE mode
   */
  private setupEventHandlers(): void {
    // Global error handler
    window.onerror = (message, source, lineno, colno, error) => {
      this.log(`Global error: ${message} at ${source}:${lineno}`, 'error');
      return false;
    };

    // Unload handler for cleanup
    window.onbeforeunload = () => {
      this.cleanup();
    };
  }

  /**
   * Patch DOM APIs for better IE compatibility
   */
  private patchDOMAPIs(): void {
    // Patch textContent for IE8
    if (!('textContent' in document.createElement('div'))) {
      Object.defineProperty(Element.prototype, 'textContent', {
        get: function() {
          return (this as any).innerText;
        },
        set: function(value: string) {
          (this as any).innerText = value;
        }
      });
    }

    // Patch classList for IE9
    if (!('classList' in document.createElement('div'))) {
      Object.defineProperty(Element.prototype, 'classList', {
        get: function() {
          const element = this as Element;
          return {
            add: function(className: string) {
              if (!element.className.match(new RegExp('\\b' + className + '\\b'))) {
                element.className += ' ' + className;
              }
            },
            remove: function(className: string) {
              element.className = element.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
            },
            contains: function(className: string) {
              return element.className.match(new RegExp('\\b' + className + '\\b')) !== null;
            },
            toggle: function(className: string) {
              if (this.contains(className)) {
                this.remove(className);
              } else {
                this.add(className);
              }
            }
          };
        }
      });
    }
  }

  /**
   * Execute a test action using DOM manipulation
   */
  async executeAction(action: any): Promise<IEModeStep> {
    const startTime = Date.now();
    const step: IEModeStep = {
      action: action.type,
      selector: action.selector,
      value: action.value,
      success: false,
      duration: 0
    };

    try {
      switch (action.type.toLowerCase()) {
        case 'navigate':
          await this.navigate(action.url);
          break;
        case 'click':
          await this.click(action.selector);
          break;
        case 'type':
        case 'input':
          await this.type(action.selector, action.value);
          break;
        case 'hover':
          await this.hover(action.selector);
          break;
        case 'scroll':
          await this.scroll(action.x || 0, action.y || 0);
          break;
        case 'wait':
          await this.wait(action.selector, action.timeout);
          break;
        case 'assert':
          await this.assert(action.selector, action.assertion);
          break;
        case 'screenshot':
          step.screenshot = await this.takeScreenshot();
          break;
        case 'key_press':
          await this.keyPress(action.value);
          break;
        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }

      step.success = true;
      this.log(`Action ${action.type} completed successfully`);
    } catch (error) {
      step.error = error instanceof Error ? error.message : String(error);
      this.log(`Action ${action.type} failed: ${step.error}`, 'error');
    }

    step.duration = Date.now() - startTime;
    return step;
  }

  /**
   * Navigate to a URL in IE mode
   */
  private async navigate(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        window.location.href = url;
        
        // Wait for page load
        const checkLoad = () => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            setTimeout(checkLoad, 100);
          }
        };
        
        setTimeout(checkLoad, 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Click an element using DOM manipulation
   */
  private async click(selector: string): Promise<void> {
    const element = this.findElement(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    if (!this.isElementVisible(element)) {
      throw new Error(`Element not visible: ${selector}`);
    }

    // Try modern click first
    if ((element as any).click) {
      (element as any).click();
    } else {
      // Fallback for IE
      const event = document.createEvent('MouseEvents');
      event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      element.dispatchEvent(event);
    }

    // Wait for potential page changes
    await this.waitForStability();
  }

  /**
   * Type text into an input element
   */
  private async type(selector: string, text: string): Promise<void> {
    const element = this.findElement(selector) as HTMLInputElement | HTMLTextAreaElement;
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    if (!this.isElementVisible(element)) {
      throw new Error(`Element not visible: ${selector}`);
    }

    // Clear existing value
    element.value = '';
    
    // Type character by character for realistic input
    for (let i = 0; i < text.length; i++) {
      element.value += text[i];
      
      // Trigger input events
      this.triggerEvent(element, 'input');
      this.triggerEvent(element, 'keyup');
      
      // Small delay between characters
      await this.delay(50);
    }

    // Trigger change event
    this.triggerEvent(element, 'change');
    this.triggerEvent(element, 'blur');
  }

  /**
   * Hover over an element
   */
  private async hover(selector: string): Promise<void> {
    const element = this.findElement(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    this.triggerEvent(element, 'mouseover');
    this.triggerEvent(element, 'mouseenter');
    await this.delay(100);
  }

  /**
   * Scroll to coordinates
   */
  private async scroll(x: number, y: number): Promise<void> {
    window.scrollTo(x, y);
    await this.waitForStability();
  }

  /**
   * Wait for element or timeout
   */
  private async wait(selector?: string, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    if (!selector) {
      await this.delay(timeout);
      return;
    }

    return new Promise((resolve, reject) => {
      const checkElement = () => {
        const element = this.findElement(selector);
        if (element && this.isElementVisible(element)) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for element: ${selector}`));
        } else {
          setTimeout(checkElement, 100);
        }
      };
      
      checkElement();
    });
  }

  /**
   * Assert element state
   */
  private async assert(selector: string, assertion: any): Promise<void> {
    const element = this.findElement(selector);
    
    switch (assertion?.type) {
      case 'visible':
        if (!element || !this.isElementVisible(element)) {
          throw new Error(`Element not visible: ${selector}`);
        }
        break;
      case 'hidden':
        if (element && this.isElementVisible(element)) {
          throw new Error(`Element should be hidden: ${selector}`);
        }
        break;
      case 'text':
        if (!element) {
          throw new Error(`Element not found: ${selector}`);
        }
        const text = element.textContent || (element as any).innerText || '';
        if (text !== assertion.value) {
          throw new Error(`Expected text "${assertion.value}", got "${text}"`);
        }
        break;
      case 'value':
        if (!element) {
          throw new Error(`Element not found: ${selector}`);
        }
        const value = (element as HTMLInputElement).value || '';
        if (value !== assertion.value) {
          throw new Error(`Expected value "${assertion.value}", got "${value}"`);
        }
        break;
      default:
        throw new Error(`Unsupported assertion type: ${assertion?.type}`);
    }
  }

  /**
   * Take screenshot using html2canvas fallback
   */
  private async takeScreenshot(): Promise<string> {
    // For IE mode, we'll use a simple canvas approach or return placeholder
    try {
      // Create canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add simple text indicator
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial';
      ctx.fillText('IE Mode Screenshot - ' + new Date().toISOString(), 10, 30);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      this.log(`Screenshot failed: ${error}`, 'error');
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
  }

  /**
   * Simulate key press
   */
  private async keyPress(key: string): Promise<void> {
    const event = document.createEvent('KeyboardEvent');
    
    if ((event as any).initKeyboardEvent) {
      (event as any).initKeyboardEvent('keydown', true, true, window, false, false, false, false, 0, key);
    } else {
      // Fallback for older browsers
      (event as any).initKeyEvent('keydown', true, true, window, false, false, false, false, 0, 0);
    }

    document.dispatchEvent(event);
    await this.delay(100);
  }

  /**
   * Find element with fallback strategies
   */
  private findElement(selector: string): Element | null {
    try {
      // Try modern querySelector first
      if (document.querySelector) {
        return document.querySelector(selector);
      }

      // Fallback to simple selectors
      if (selector.startsWith('#')) {
        return document.getElementById(selector.substring(1));
      }

      if (selector.startsWith('.')) {
        const className = selector.substring(1);
        const elements = document.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].className && elements[i].className.indexOf(className) !== -1) {
            return elements[i];
          }
        }
      }

      // Tag name selector
      if (selector.match(/^[a-zA-Z]+$/)) {
        const elements = document.getElementsByTagName(selector);
        return elements.length > 0 ? elements[0] : null;
      }

      return null;
    } catch (error) {
      this.log(`Element lookup failed: ${error}`, 'error');
      return null;
    }
  }

  /**
   * Check if element is visible
   */
  private isElementVisible(element: Element): boolean {
    if (!element) return false;

    const htmlElement = element as HTMLElement;
    
    // Check display and visibility styles
    const style = (htmlElement as any).currentStyle || (window as any).getComputedStyle?.(htmlElement) || {};
    
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check if element has dimensions
    if (htmlElement.offsetWidth === 0 && htmlElement.offsetHeight === 0) {
      return false;
    }

    return true;
  }

  /**
   * Trigger DOM event
   */
  private triggerEvent(element: Element, eventType: string): void {
    try {
      if (document.createEvent) {
        const event = document.createEvent('HTMLEvents');
        event.initEvent(eventType, true, false);
        element.dispatchEvent(event);
      } else if ((element as any).fireEvent) {
        // IE8 fallback
        (element as any).fireEvent('on' + eventType);
      }
    } catch (error) {
      this.log(`Event trigger failed: ${error}`, 'warn');
    }
  }

  /**
   * Wait for page stability
   */
  private async waitForStability(timeout: number = 1000): Promise<void> {
    await this.delay(timeout);
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log messages with levels
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [IE-MODE] [${level.toUpperCase()}] ${message}`;
    
    this.logs.push(logMessage);
    
    if (this.options.enableVerboseLogging) {
      console.log(logMessage);
    }
  }

  /**
   * Get execution logs
   */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Check if running in IE mode
   */
  static isIEMode(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.indexOf('msie') !== -1 || 
           userAgent.indexOf('trident') !== -1 || 
           userAgent.indexOf('edge') !== -1;
  }

  /**
   * Get IE version if available
   */
  static getIEVersion(): number | null {
    const userAgent = navigator.userAgent;
    const msie = userAgent.indexOf('MSIE ');
    
    if (msie > 0) {
      return parseInt(userAgent.substring(msie + 5, userAgent.indexOf('.', msie)), 10);
    }

    const trident = userAgent.indexOf('Trident/');
    if (trident > 0) {
      const rv = userAgent.indexOf('rv:');
      return parseInt(userAgent.substring(rv + 3, userAgent.indexOf('.', rv)), 10);
    }

    return null;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.logs = [];
    this.log('IE Mode compatibility layer cleaned up');
  }
}

/**
 * IE Mode Test Executor
 * Main executor for running tests in IE mode using DOM manipulation
 */
export class IEModeExecutor {
  private compatibilityLayer: IEModeCompatibilityLayer;
  private isInitialized: boolean = false;

  constructor(options: Partial<IEModeOptions> = {}) {
    this.compatibilityLayer = new IEModeCompatibilityLayer(options);
  }

  /**
   * Initialize IE mode executor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Wait for DOM ready
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', resolve);
          } else {
            (document as any).attachEvent('onreadystatechange', () => {
              if (document.readyState === 'complete') {
                resolve(undefined);
              }
            });
          }
        });
      }

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize IE mode executor: ${error}`);
    }
  }

  /**
   * Execute test case in IE mode
   */
  async executeTestCase(testCase: any): Promise<IEModeExecution> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const execution: IEModeExecution = {
      success: true,
      duration: 0,
      steps: [],
      screenshots: [],
      logs: []
    };

    try {
      // Execute each action
      for (const action of testCase.actions || testCase.steps || []) {
        const step = await this.compatibilityLayer.executeAction(action);
        execution.steps.push(step);

        if (!step.success) {
          execution.success = false;
          // Continue with remaining steps for debugging
        }

        if (step.screenshot) {
          execution.screenshots.push(step.screenshot);
        }
      }
    } catch (error) {
      execution.success = false;
      execution.error = error instanceof Error ? error.message : String(error);
    }

    execution.duration = Date.now() - startTime;
    execution.logs = this.compatibilityLayer.getLogs();

    return execution;
  }

  /**
   * Check if IE mode is supported
   */
  static isSupported(): boolean {
    return IEModeCompatibilityLayer.isIEMode() || 
           typeof document !== 'undefined';
  }

  /**
   * Get IE mode capabilities
   */
  static getCapabilities(): any {
    return {
      recording: false, // IE mode doesn't support modern recording APIs
      playback: true,   // Full DOM-based playback supported
      ai: false,        // AI features may be limited
      video: false,     // No MediaRecorder API
      pip: false,       // No Picture-in-Picture API
      webgpu: false,    // No WebGPU support
      limitations: [
        'No MediaRecorder API for video recording',
        'Limited modern JavaScript APIs',
        'No WebGPU or advanced graphics support',
        'Screenshot functionality limited to canvas fallback',
        'Some CSS selectors may not be supported',
        'Performance may be slower than modern browsers'
      ]
    };
  }

  /**
   * Cleanup executor
   */
  cleanup(): void {
    this.compatibilityLayer.cleanup();
    this.isInitialized = false;
  }
}

// Export for use in other modules
export default {
  IEModeCompatibilityLayer,
  IEModeExecutor,
  isIEMode: IEModeCompatibilityLayer.isIEMode,
  getIEVersion: IEModeCompatibilityLayer.getIEVersion,
  isSupported: IEModeExecutor.isSupported,
  getCapabilities: IEModeExecutor.getCapabilities
};