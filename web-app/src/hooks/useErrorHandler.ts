/**
 * React Error Handling Hook
 * Provides React integration for the ErrorManager
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorManager, AutoTestError, ErrorSeverity, ErrorType, RecoveryStrategy } from '../errors/ErrorManager';

export interface UseErrorHandlerConfig {
  enableRecovery?: boolean;
  enableNotifications?: boolean;
  autoReport?: boolean;
  maxRetries?: number;
  onError?: (error: AutoTestError) => void;
  onRecovery?: (error: AutoTestError) => void;
}

export interface ErrorHandlerState {
  currentError: AutoTestError | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  errorHistory: AutoTestError[];
}

export const useErrorHandler = (config: UseErrorHandlerConfig = {}) => {
  const {
    enableRecovery = true,
    enableNotifications = true,
    autoReport = true,
    maxRetries = 3,
    onError,
    onRecovery
  } = config;

  const [state, setState] = useState<ErrorHandlerState>({
    currentError: null,
    isRecovering: false,
    recoveryAttempts: 0,
    errorHistory: []
  });

  const errorManagerRef = useRef<ErrorManager>();
  const recoveryTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize ErrorManager
  useEffect(() => {
    if (!errorManagerRef.current) {
      errorManagerRef.current = ErrorManager.getInstance();
    }
  }, []);

  // Handle error events
  useEffect(() => {
    const handleError = (event: CustomEvent) => {
      const { error, recovered } = event.detail;
      
      setState(prev => ({
        ...prev,
        currentError: recovered ? null : error,
        errorHistory: [error, ...prev.errorHistory.slice(0, 9)] // Keep last 10 errors
      }));

      if (recovered) {
        onRecovery?.(error);
      } else {
        onError?.(error);
      }
    };

    window.addEventListener('autotest:error', handleError as EventListener);
    window.addEventListener('autotest:error-recovered', handleError as EventListener);

    return () => {
      window.removeEventListener('autotest:error', handleError as EventListener);
      window.removeEventListener('autotest:error-recovered', handleError as EventListener);
    };
  }, [onError, onRecovery]);

  // Handle retry events
  useEffect(() => {
    const handleRetry = (event: CustomEvent) => {
      const { error } = event.detail;
      if (error.id === state.currentError?.id) {
        attemptRecovery(error);
      }
    };

    window.addEventListener('autotest:retry', handleRetry as EventListener);
    
    return () => {
      window.removeEventListener('autotest:retry', handleRetry as EventListener);
    };
  }, [state.currentError]);

  const attemptRecovery = useCallback(async (error: AutoTestError) => {
    if (!enableRecovery || state.recoveryAttempts >= maxRetries || !errorManagerRef.current) {
      return false;
    }

    setState(prev => ({
      ...prev,
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1
    }));

    try {
      const recovered = await errorManagerRef.current.getRecoveryManager().handleError(error);
      
      setState(prev => ({
        ...prev,
        isRecovering: false,
        currentError: recovered ? null : error
      }));

      return recovered;
    } catch (recoveryError) {
      setState(prev => ({
        ...prev,
        isRecovering: false
      }));
      
      console.error('Recovery failed:', recoveryError);
      return false;
    }
  }, [enableRecovery, maxRetries, state.recoveryAttempts]);

  const handleError = useCallback(async (
    error: Error | string,
    context: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      component?: string;
      operation?: string;
      metadata?: Record<string, any>;
      recoveryStrategy?: RecoveryStrategy;
    } = {}
  ) => {
    if (!errorManagerRef.current) return;

    const autoTestError = errorManagerRef.current.createError(
      context.type || ErrorType.UNKNOWN_ERROR,
      typeof error === 'string' ? error : error.message,
      {
        severity: context.severity || ErrorSeverity.MEDIUM,
        context: {
          component: context.component,
          operation: context.operation,
          ...context.metadata
        },
        recoveryStrategy: context.recoveryStrategy,
        cause: typeof error === 'string' ? undefined : error
      }
    );

    await errorManagerRef.current.handleError(autoTestError);

    if (enableRecovery && autoTestError.recoveryStrategy === RecoveryStrategy.RETRY) {
      // Auto-retry after a delay
      recoveryTimeoutRef.current = setTimeout(() => {
        attemptRecovery(autoTestError);
      }, 1000);
    }
  }, [enableRecovery, attemptRecovery]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentError: null,
      recoveryAttempts: 0
    }));

    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current);
    }
  }, []);

  const reportError = useCallback(async (error: AutoTestError, additionalContext?: Record<string, any>) => {
    if (!errorManagerRef.current) return;

    await errorManagerRef.current.getReporter().reportError(error);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    handleError,
    clearError,
    reportError,
    attemptRecovery: () => state.currentError ? attemptRecovery(state.currentError) : Promise.resolve(false),
    canRetry: state.currentError?.recoveryStrategy === RecoveryStrategy.RETRY && 
              state.recoveryAttempts < maxRetries
  };
};

// Hook for handling async operations with error handling
export const useAsyncError = () => {
  const { handleError } = useErrorHandler();

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context: {
      operation: string;
      component?: string;
      onError?: (error: AutoTestError) => void;
      onSuccess?: (result: T) => void;
    }
  ): Promise<T | null> => {
    try {
      const result = await asyncFn();
      context.onSuccess?.(result);
      return result;
    } catch (error) {
      await handleError(error as Error, {
        type: ErrorType.UNKNOWN_ERROR,
        operation: context.operation,
        component: context.component,
        severity: ErrorSeverity.MEDIUM,
        recoveryStrategy: RecoveryStrategy.RETRY
      });
      return null;
    }
  }, [handleError]);

  return { executeAsync };
};

// Hook for form validation with error handling
export const useFormError = () => {
  const { handleError } = useErrorHandler();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((
    fieldName: string,
    value: unknown,
    validators: Array<(value: unknown) => string | null>
  ) => {
    const errors = validators
      .map(validator => validator(value))
      .filter(error => error !== null);

    if (errors.length > 0) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: errors[0]!
      }));

      handleError(new Error(`Validation failed for field: ${fieldName}`), {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        component: 'FormValidation',
        operation: 'validateField',
        metadata: { fieldName, value, errors }
      });

      return false;
    } else {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
      return true;
    }
  }, [handleError]);

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  return {
    fieldErrors,
    validateField,
    clearFieldError,
    clearAllErrors,
    hasErrors: Object.keys(fieldErrors).length > 0
  };
};

export default useErrorHandler;