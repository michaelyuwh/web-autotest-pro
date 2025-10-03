import { TestCase, TestAction, ActionType } from './types';

/**
 * Comprehensive input validation and sanitization utilities
 * Implements security best practices for user input handling
 */

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: T;
}

export class InputValidator {
  private static readonly MAX_STRING_LENGTH = 10000;
  private static readonly MAX_ARRAY_LENGTH = 1000;
  private static readonly ALLOWED_PROTOCOLS = ['http:', 'https:'];
  private static readonly ALLOWED_FILE_TYPES = ['.json', '.yaml', '.yml'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/data:/gi, '')
      .trim();
  }

  /**
   * Sanitize and validate URLs
   */
  static validateUrl(url: string): ValidationResult {
    const errors: string[] = [];
    
    try {
      const urlObj = new URL(url);
      
      if (!this.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
        errors.push(`Protocol ${urlObj.protocol} is not allowed. Use http: or https:`);
      }
      
      // Check for suspicious patterns
      if (url.includes('javascript:') || url.includes('data:')) {
        errors.push('URLs with javascript: or data: protocols are not allowed');
      }
      
      // Sanitize URL
      const sanitizedUrl = url.replace(/[<>"']/g, '');
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings: [],
        sanitizedData: sanitizedUrl
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid URL format'],
        warnings: []
      };
    }
  }

  /**
   * Validate and sanitize test case data
   */
  static validateTestCase(testCase: Partial<TestCase>): ValidationResult<TestCase> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!testCase.name || typeof testCase.name !== 'string') {
      errors.push('Test case name is required and must be a string');
    } else if (testCase.name.length > this.MAX_STRING_LENGTH) {
      errors.push(`Test case name exceeds maximum length of ${this.MAX_STRING_LENGTH}`);
    }

    if (!testCase.url || typeof testCase.url !== 'string') {
      errors.push('Test case URL is required and must be a string');
    } else {
      const urlValidation = this.validateUrl(testCase.url);
      if (!urlValidation.isValid) {
        errors.push(...urlValidation.errors);
      }
    }

    // Validate steps/actions
    if (!Array.isArray(testCase.steps) && !Array.isArray(testCase.actions)) {
      errors.push('Test case must have steps or actions array');
    } else {
      const steps = testCase.steps || testCase.actions || [];
      
      if (steps.length > this.MAX_ARRAY_LENGTH) {
        errors.push(`Too many steps. Maximum allowed: ${this.MAX_ARRAY_LENGTH}`);
      }

      steps.forEach((step: Partial<TestAction>, index: number) => {
        const stepValidation = this.validateTestAction(step);
        if (!stepValidation.isValid) {
          errors.push(`Step ${index + 1}: ${stepValidation.errors.join(', ')}`);
        }
      });
    }

    // Sanitize data
    const sanitizedSteps = (testCase.steps || testCase.actions || [])
      .map((step: Partial<TestAction>) => this.validateTestAction(step).sanitizedData)
      .filter((step): step is TestAction => step !== undefined);

    const sanitizedTestCase: TestCase = {
      id: testCase.id || `test_${Date.now()}`,
      name: this.sanitizeHtml(testCase.name || ''),
      description: this.sanitizeHtml(testCase.description || ''),
      url: testCase.url || '',
      steps: sanitizedSteps,
      actions: sanitizedSteps, // For backward compatibility
      tags: Array.isArray(testCase.tags) ? 
        testCase.tags.slice(0, 20).map((tag: string) => this.sanitizeHtml(tag)) : [],
      successCriteria: testCase.successCriteria || [],
      metadata: {
        author: testCase.metadata?.author || 'Unknown',
        browser: testCase.metadata?.browser || 'chromium',
        deviceType: testCase.metadata?.deviceType || 'desktop',
        viewport: testCase.metadata?.viewport || { width: 1280, height: 720 },
        userAgent: testCase.metadata?.userAgent || 'Web AutoTest Pro'
      },
      createdAt: typeof testCase.createdAt === 'number' ? testCase.createdAt : Date.now(),
      updatedAt: Date.now(),
      version: 1
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: sanitizedTestCase
    };
  }

  /**
   * Validate test action/step
   */
  static validateTestAction(action: Partial<TestAction>): ValidationResult<TestAction> {
    const errors: string[] = [];
    
    if (!action.type || !Object.values(ActionType).includes(action.type)) {
      errors.push('Invalid or missing action type');
    }

    if (action.selector && typeof action.selector !== 'string') {
      errors.push('Selector must be a string');
    }

    if (action.value && typeof action.value !== 'string') {
      errors.push('Value must be a string');
    }

    if (action.url) {
      const urlValidation = this.validateUrl(action.url);
      if (!urlValidation.isValid) {
        errors.push(...urlValidation.errors);
      }
    }

    // Sanitize action
    const sanitizedAction: TestAction = {
      id: action.id || `action_${Date.now()}_${Math.random()}`,
      type: action.type || ActionType.CLICK,
      description: action.description ? this.sanitizeHtml(action.description) : 'Generated action',
      timestamp: typeof action.timestamp === 'number' ? action.timestamp : Date.now(),
      selector: action.selector ? this.sanitizeHtml(action.selector) : undefined,
      value: action.value ? this.sanitizeHtml(action.value) : undefined,
      url: action.url,
      x: typeof action.x === 'number' ? action.x : undefined,
      y: typeof action.y === 'number' ? action.y : undefined,
      timeout: typeof action.timeout === 'number' ? Math.min(action.timeout, 60000) : undefined,
      critical: typeof action.critical === 'boolean' ? action.critical : true,
      assertion: action.assertion ? {
        type: action.assertion.type,
        value: this.sanitizeHtml(action.assertion.value || '')
      } : undefined
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      sanitizedData: sanitizedAction
    };
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: File): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.ALLOWED_FILE_TYPES.includes(extension)) {
      errors.push(`File type ${extension} is not allowed. Allowed types: ${this.ALLOWED_FILE_TYPES.join(', ')}`);
    }

    // Check filename for suspicious content
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('Filename contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Rate limiting helper
   */
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true;
    };
  }

  /**
   * Sanitize JSON data to prevent prototype pollution
   */
  static sanitizeJson<T = Record<string, unknown>>(data: unknown): T {
    if (typeof data !== 'object' || data === null) {
      return data as T;
    }

    const sanitized: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue; // Skip dangerous properties
      }
      
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeJson(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized as T;
  }
}

// Rate limiter instances
export const aiServiceRateLimiter = InputValidator.createRateLimiter(10, 60000); // 10 requests per minute
export const fileUploadRateLimiter = InputValidator.createRateLimiter(5, 60000); // 5 uploads per minute
export const testExecutionRateLimiter = InputValidator.createRateLimiter(20, 60000); // 20 executions per minute