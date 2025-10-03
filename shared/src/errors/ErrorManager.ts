/**
 * Comprehensive Error Handling System
 * Provides centralized error management, classification, recovery, and reporting
 */

// Error Types and Classifications
export enum ErrorType {
  // Network and Connectivity
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_LOST = 'CONNECTION_LOST',
  
  // AI Service Errors
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_MODEL_LOAD_ERROR = 'AI_MODEL_LOAD_ERROR',
  AI_INFERENCE_ERROR = 'AI_INFERENCE_ERROR',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  
  // Test Execution Errors
  TEST_EXECUTION_ERROR = 'TEST_EXECUTION_ERROR',
  SELECTOR_NOT_FOUND = 'SELECTOR_NOT_FOUND',
  PAGE_LOAD_ERROR = 'PAGE_LOAD_ERROR',
  NAVIGATION_ERROR = 'NAVIGATION_ERROR',
  
  // File and Data Errors
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Authentication and Authorization
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  
  // System and Resource Errors
  MEMORY_ERROR = 'MEMORY_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  
  // Unknown and Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RecoveryStrategy {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  DEGRADE = 'DEGRADE',
  ABORT = 'ABORT',
  USER_ACTION = 'USER_ACTION'
}

// Base Error Interface
export interface BaseError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  stack?: string;
  recoveryStrategy: RecoveryStrategy;
  userMessage: string;
  actionable: boolean;
}

// Specific Error Classes
export class AutoTestError extends Error implements BaseError {
  public readonly id: string;
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;
  public readonly recoveryStrategy: RecoveryStrategy;
  public readonly userMessage: string;
  public readonly actionable: boolean;

  constructor(
    type: ErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity;
      context?: Record<string, unknown>;
      recoveryStrategy?: RecoveryStrategy;
      userMessage?: string;
      actionable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'AutoTestError';
    this.id = crypto.randomUUID();
    this.type = type;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.timestamp = new Date();
    this.context = options.context;
    this.recoveryStrategy = options.recoveryStrategy || RecoveryStrategy.RETRY;
    this.userMessage = options.userMessage || this.getDefaultUserMessage();
    this.actionable = options.actionable !== false;

    if (options.cause) {
      this.cause = options.cause;
      this.stack = options.cause.stack;
    }
  }

  private getDefaultUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Network connection issue. Please check your internet connection.';
      case ErrorType.AI_SERVICE_ERROR:
        return 'AI service is temporarily unavailable. Please try again.';
      case ErrorType.TEST_EXECUTION_ERROR:
        return 'Test execution failed. Please review your test configuration.';
      case ErrorType.FILE_READ_ERROR:
        return 'Unable to read the file. Please check the file format.';
      case ErrorType.AUTH_ERROR:
        return 'Authentication failed. Please sign in again.';
      case ErrorType.MEMORY_ERROR:
        return 'System resources are low. Please close other applications.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
      recoveryStrategy: this.recoveryStrategy,
      actionable: this.actionable
    };
  }
}

// Error Recovery System
export interface RecoveryAction {
  strategy: RecoveryStrategy;
  maxAttempts: number;
  backoffMs: number;
  fallbackAction?: () => Promise<void>;
  onRetry?: (attempt: number) => void;
  onFailure?: (error: AutoTestError) => void;
}

export class ErrorRecoveryManager {
  private retryAttempts = new Map<string, number>();
  private recoveryActions = new Map<ErrorType, RecoveryAction>();

  constructor() {
    this.setupDefaultRecoveryActions();
  }

  private setupDefaultRecoveryActions() {
    // Network errors - retry with exponential backoff
    this.recoveryActions.set(ErrorType.NETWORK_ERROR, {
      strategy: RecoveryStrategy.RETRY,
      maxAttempts: 3,
      backoffMs: 1000,
      onRetry: (attempt) => console.log(`Network retry attempt ${attempt}`)
    });

    // AI service errors - retry with fallback to cached responses
    this.recoveryActions.set(ErrorType.AI_SERVICE_ERROR, {
      strategy: RecoveryStrategy.FALLBACK,
      maxAttempts: 2,
      backoffMs: 2000,
      fallbackAction: async () => {
        console.log('Using cached AI responses');
      }
    });

    // Test execution errors - degrade gracefully
    this.recoveryActions.set(ErrorType.TEST_EXECUTION_ERROR, {
      strategy: RecoveryStrategy.DEGRADE,
      maxAttempts: 1,
      backoffMs: 0,
      fallbackAction: async () => {
        console.log('Continuing with simplified test execution');
      }
    });

    // File errors - require user action
    this.recoveryActions.set(ErrorType.FILE_READ_ERROR, {
      strategy: RecoveryStrategy.USER_ACTION,
      maxAttempts: 0,
      backoffMs: 0
    });
  }

  async handleError(error: AutoTestError): Promise<boolean> {
    const recoveryAction = this.recoveryActions.get(error.type);
    if (!recoveryAction) {
      return false;
    }

    const currentAttempts = this.retryAttempts.get(error.id) || 0;

    switch (recoveryAction.strategy) {
      case RecoveryStrategy.RETRY:
        return this.handleRetry(error, recoveryAction, currentAttempts);
      
      case RecoveryStrategy.FALLBACK:
        return this.handleFallback(error, recoveryAction);
      
      case RecoveryStrategy.DEGRADE:
        return this.handleDegrade(error, recoveryAction);
      
      case RecoveryStrategy.USER_ACTION:
        return this.handleUserAction(error);
      
      default:
        return false;
    }
  }

  private async handleRetry(
    error: AutoTestError, 
    action: RecoveryAction, 
    currentAttempts: number
  ): Promise<boolean> {
    if (currentAttempts >= action.maxAttempts) {
      action.onFailure?.(error);
      return false;
    }

    this.retryAttempts.set(error.id, currentAttempts + 1);

    // Exponential backoff
    const delay = action.backoffMs * Math.pow(2, currentAttempts);
    await new Promise(resolve => setTimeout(resolve, delay));

    action.onRetry?.(currentAttempts + 1);
    return true;
  }

  private async handleFallback(error: AutoTestError, action: RecoveryAction): Promise<boolean> {
    try {
      await action.fallbackAction?.();
      return true;
    } catch (fallbackError) {
      console.error('Fallback action failed:', fallbackError);
      return false;
    }
  }

  private async handleDegrade(error: AutoTestError, action: RecoveryAction): Promise<boolean> {
    try {
      await action.fallbackAction?.();
      return true;
    } catch (degradeError) {
      console.error('Graceful degradation failed:', degradeError);
      return false;
    }
  }

  private handleUserAction(error: AutoTestError): boolean {
    // Emit event for UI to handle
    window.dispatchEvent(new CustomEvent('autotest:user-action-required', {
      detail: { error }
    }));
    return true;
  }

  clearRetryHistory(errorId: string) {
    this.retryAttempts.delete(errorId);
  }

  registerRecoveryAction(errorType: ErrorType, action: RecoveryAction) {
    this.recoveryActions.set(errorType, action);
  }
}

// Error Reporter
export interface ErrorReportDestination {
  name: string;
  send: (error: AutoTestError) => Promise<void>;
  shouldReport: (error: AutoTestError) => boolean;
}

export class ErrorReporter {
  private destinations: ErrorReportDestination[] = [];
  private reportQueue: AutoTestError[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.setupNetworkListeners();
    this.setupDefaultDestinations();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private setupDefaultDestinations() {
    // Console destination (development)
    this.addDestination({
      name: 'console',
      send: async (error) => {
        console.group(`🚨 AutoTest Error: ${error.type}`);
        console.error('Message:', error.message);
        console.error('Severity:', error.severity);
        console.error('Context:', error.context);
        console.error('Stack:', error.stack);
        console.groupEnd();
      },
      shouldReport: () => process.env.NODE_ENV === 'development'
    });

    // Local storage destination (offline backup)
    this.addDestination({
      name: 'localStorage',
      send: async (error) => {
        const errors = JSON.parse(localStorage.getItem('autotest_errors') || '[]');
        errors.push(error.toJSON());
        // Keep only last 50 errors
        if (errors.length > 50) {
          errors.splice(0, errors.length - 50);
        }
        localStorage.setItem('autotest_errors', JSON.stringify(errors));
      },
      shouldReport: (error) => error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL
    });

    // Remote endpoint destination
    this.addDestination({
      name: 'remote',
      send: async (error) => {
        const response = await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(error.toJSON())
        });

        if (!response.ok) {
          throw new Error(`Failed to report error: ${response.statusText}`);
        }
      },
      shouldReport: (error) => 
        this.isOnline && 
        (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL)
    });
  }

  addDestination(destination: ErrorReportDestination) {
    this.destinations.push(destination);
  }

  async reportError(error: AutoTestError) {
    if (!this.isOnline && error.severity !== ErrorSeverity.CRITICAL) {
      this.reportQueue.push(error);
      return;
    }

    const reportPromises = this.destinations
      .filter(dest => dest.shouldReport(error))
      .map(async (dest) => {
        try {
          await dest.send(error);
        } catch (reportError) {
          console.error(`Failed to report to ${dest.name}:`, reportError);
        }
      });

    await Promise.allSettled(reportPromises);
  }

  private async flushQueue() {
    const queueCopy = [...this.reportQueue];
    this.reportQueue = [];

    for (const error of queueCopy) {
      await this.reportError(error);
    }
  }

  getStoredErrors(): AutoTestError[] {
    const stored = localStorage.getItem('autotest_errors');
    return stored ? JSON.parse(stored) : [];
  }
}

// Central Error Manager
export class ErrorManager {
  private static instance: ErrorManager;
  private recoveryManager: ErrorRecoveryManager;
  private reporter: ErrorReporter;
  private errorHistory: AutoTestError[] = [];

  private constructor() {
    this.recoveryManager = new ErrorRecoveryManager();
    this.reporter = new ErrorReporter();
    this.setupGlobalErrorHandling();
  }

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  private setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = new AutoTestError(
        ErrorType.UNKNOWN_ERROR,
        event.reason?.message || 'Unhandled promise rejection',
        {
          severity: ErrorSeverity.HIGH,
          context: { reason: event.reason },
          recoveryStrategy: RecoveryStrategy.ABORT,
          cause: event.reason
        }
      );
      this.handleError(error);
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      const error = new AutoTestError(
        ErrorType.UNKNOWN_ERROR,
        event.message,
        {
          severity: ErrorSeverity.HIGH,
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          },
          recoveryStrategy: RecoveryStrategy.ABORT,
          cause: event.error
        }
      );
      this.handleError(error);
    });
  }

  async handleError(error: AutoTestError): Promise<void> {
    // Add to history
    this.errorHistory.push(error);
    
    // Keep only last 100 errors in memory
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift();
    }

    // Report the error
    await this.reporter.reportError(error);

    // Attempt recovery
    const recovered = await this.recoveryManager.handleError(error);
    
    if (!recovered && error.actionable) {
      // Emit custom event for UI components to handle
      window.dispatchEvent(new CustomEvent('autotest:error', {
        detail: { error, recovered: false }
      }));
    }
  }

  createError(
    type: ErrorType,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: Record<string, unknown>;
      recoveryStrategy?: RecoveryStrategy;
      userMessage?: string;
      actionable?: boolean;
      cause?: Error;
    }
  ): AutoTestError {
    return new AutoTestError(type, message, options);
  }

  getErrorHistory(): AutoTestError[] {
    return [...this.errorHistory];
  }

  getRecoveryManager(): ErrorRecoveryManager {
    return this.recoveryManager;
  }

  getReporter(): ErrorReporter {
    return this.reporter;
  }
}

// Utility functions for common error scenarios
export function createNetworkError(message: string, context?: Record<string, unknown>) {
  return new AutoTestError(ErrorType.NETWORK_ERROR, message, {
    severity: ErrorSeverity.MEDIUM,
    context,
    recoveryStrategy: RecoveryStrategy.RETRY,
    userMessage: 'Network issue detected. Retrying...'
  });
}

export function createAIServiceError(message: string, context?: Record<string, unknown>) {
  return new AutoTestError(ErrorType.AI_SERVICE_ERROR, message, {
    severity: ErrorSeverity.HIGH,
    context,
    recoveryStrategy: RecoveryStrategy.FALLBACK,
    userMessage: 'AI service is temporarily unavailable. Using cached responses.'
  });
}

export function createTestExecutionError(message: string, context?: Record<string, unknown>) {
  return new AutoTestError(ErrorType.TEST_EXECUTION_ERROR, message, {
    severity: ErrorSeverity.HIGH,
    context,
    recoveryStrategy: RecoveryStrategy.DEGRADE,
    userMessage: 'Test execution encountered an issue. Continuing with simplified testing.'
  });
}

export function createValidationError(message: string, context?: Record<string, unknown>) {
  return new AutoTestError(ErrorType.VALIDATION_ERROR, message, {
    severity: ErrorSeverity.MEDIUM,
    context,
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    userMessage: 'Please check your input and try again.'
  });
}

// Export singleton instance
export const errorManager = ErrorManager.getInstance();