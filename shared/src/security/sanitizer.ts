/**
 * Input Sanitization Service
 * Provides security utilities to prevent XSS attacks and other injection vulnerabilities
 */

// DOMPurify will be available globally after the security fixes
declare global {
  interface Window {
    DOMPurify?: {
      sanitize: (dirty: string, config?: Record<string, unknown>) => string;
    };
  }
}

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripComments?: boolean;
}

export class InputSanitizer {
  private static readonly DEFAULT_ALLOWED_TAGS = [
    'b', 'i', 'em', 'strong', 'code', 'pre', 'span', 'div', 'p'
  ];

  private static readonly DEFAULT_ALLOWED_ATTRIBUTES: string[] = [];

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHTML(dirty: string, options: SanitizationOptions = {}): string {
    // Use DOMPurify if available (after jspdf update includes it)
    if (typeof window !== 'undefined' && window.DOMPurify) {
      return window.DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: options.allowedTags || this.DEFAULT_ALLOWED_TAGS,
        ALLOWED_ATTR: options.allowedAttributes || this.DEFAULT_ALLOWED_ATTRIBUTES,
        STRIP_COMMENTS: options.stripComments !== false
      });
    }

    // Fallback manual sanitization
    return this.manualSanitize(dirty, options);
  }

  /**
   * Remove potentially dangerous JavaScript from strings
   */
  static sanitizeScript(input: string): string {
    return input
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove data: URLs that could contain scripts
      .replace(/data:\s*text\/html/gi, 'data:text/plain')
      // Remove vbscript: URLs
      .replace(/vbscript:/gi, '')
      // Remove expression() CSS
      .replace(/expression\s*\(/gi, '');
  }

  /**
   * Sanitize test selectors and CSS selectors
   */
  static sanitizeSelector(selector: string): string {
    // Allow only safe characters for CSS selectors
    return selector.replace(/[^a-zA-Z0-9\-_#.\[\]=:()>\s]/g, '');
  }

  /**
   * Sanitize URL to prevent navigation attacks
   */
  static sanitizeURL(url: string): string {
    // Remove dangerous protocols
    const dangerousProtocols = /^(javascript|vbscript|data|file):/i;
    
    if (dangerousProtocols.test(url)) {
      return '#';
    }

    // Only allow http, https, and relative URLs
    if (!/^(https?:\/\/|\/|#)/.test(url)) {
      return '#';
    }

    return url;
  }

  /**
   * Sanitize file names for safe storage/display
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      // Remove path traversal attempts
      .replace(/\.\./g, '')
      .replace(/[\/\\]/g, '')
      // Remove potentially dangerous characters
      .replace(/[<>:"|?*]/g, '')
      // Trim and limit length
      .trim()
      .substring(0, 255);
  }

  /**
   * Validate and sanitize test data inputs
   */
  static sanitizeTestData(data: unknown): unknown {
    if (typeof data === 'string') {
      return this.sanitizeHTML(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeTestData(item));
    }
    
    if (data && typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        const sanitizedKey = this.sanitizeScript(key);
        sanitized[sanitizedKey] = this.sanitizeTestData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Manual sanitization fallback when DOMPurify is not available
   */
  private static manualSanitize(dirty: string, options: SanitizationOptions = {}): string {
    let clean = dirty;

    // Remove script tags and content
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous event handlers
    clean = clean.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
    clean = clean.replace(/on\w+\s*=\s*'[^']*'/gi, '');
    
    // Remove javascript: and vbscript: URLs
    clean = clean.replace(/javascript:[^"']*/gi, '');
    clean = clean.replace(/vbscript:[^"']*/gi, '');
    
    // Remove dangerous tags if not in allowed list
    const allowedTags = options.allowedTags || this.DEFAULT_ALLOWED_TAGS;
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
    
    clean = clean.replace(tagRegex, (match, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        return match;
      }
      return '';
    });

    return clean;
  }

  /**
   * Create a Content Security Policy nonce for inline scripts
   */
  static generateCSPNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSP compliance for dynamic content
   */
  static validateCSPCompliance(content: string): {
    isCompliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check for inline scripts
    if (/<script(?![^>]*src=)/i.test(content)) {
      violations.push('Inline script detected - violates CSP script-src');
    }

    // Check for inline styles
    if (/style\s*=/i.test(content)) {
      violations.push('Inline style detected - may violate CSP style-src');
    }

    // Check for javascript: URLs
    if (/javascript:/i.test(content)) {
      violations.push('javascript: URL detected - violates CSP');
    }

    // Check for data: URLs in scripts
    if (/src\s*=\s*["']data:/i.test(content)) {
      violations.push('data: URL in src attribute - may violate CSP');
    }

    return {
      isCompliant: violations.length === 0,
      violations
    };
  }
}

/**
 * Security validation utilities
 */
export class SecurityValidator {
  /**
   * Check if a URL is safe for navigation/embedding
   */
  static isSafeURL(url: string): boolean {
    try {
      const parsed = new URL(url, window.location.origin);
      
      // Block dangerous protocols
      const dangerousProtocols = ['javascript', 'vbscript', 'data', 'file'];
      if (dangerousProtocols.includes(parsed.protocol.replace(':', ''))) {
        return false;
      }

      // For external URLs, only allow HTTPS
      if (parsed.origin !== window.location.origin) {
        return parsed.protocol === 'https:';
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate that content doesn't contain malicious patterns
   */
  static validateContent(content: string): {
    isValid: boolean;
    risks: string[];
  } {
    const risks: string[] = [];

    // Check for script injection attempts
    if (/<script|javascript:|vbscript:/i.test(content)) {
      risks.push('Script injection attempt detected');
    }

    // Check for HTML injection
    if (/<iframe|<object|<embed|<link/i.test(content)) {
      risks.push('Potentially dangerous HTML elements detected');
    }

    // Check for SQL injection patterns (for test data)
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+set/i
    ];

    if (sqlPatterns.some(pattern => pattern.test(content))) {
      risks.push('SQL injection pattern detected');
    }

    // Check for path traversal
    if (/\.\.\/|\.\.\\/.test(content)) {
      risks.push('Path traversal attempt detected');
    }

    return {
      isValid: risks.length === 0,
      risks
    };
  }
}

export default InputSanitizer;