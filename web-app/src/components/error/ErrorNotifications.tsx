/**
 * Error Notification and Toast Components
 * Provides user-friendly error display and interaction
 */

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw } from 'lucide-react';
import { AutoTestError, ErrorSeverity, RecoveryStrategy } from '../../errors/ErrorManager';

export interface ErrorNotification {
  id: string;
  error: AutoTestError;
  isVisible: boolean;
  autoHide: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

interface ErrorToastProps {
  notification: ErrorNotification;
  onDismiss: (id: string) => void;
  onRetry?: (id: string) => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ 
  notification, 
  onDismiss, 
  onRetry 
}) => {
  const { error, isVisible } = notification;
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification.autoHide && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, getSeverityTimeout(error.severity));
      
      return () => clearTimeout(timer);
    }
  }, [notification.autoHide, isVisible, error.severity]);

  const getSeverityTimeout = (severity: ErrorSeverity): number => {
    switch (severity) {
      case ErrorSeverity.LOW: return 3000;
      case ErrorSeverity.MEDIUM: return 5000;
      case ErrorSeverity.HIGH: return 8000;
      case ErrorSeverity.CRITICAL: return 0; // No auto-hide
      default: return 5000;
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return <Info className="w-5 h-5 text-blue-500" />;
      case ErrorSeverity.MEDIUM:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case ErrorSeverity.HIGH:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case ErrorSeverity.CRITICAL:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityStyles = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ErrorSeverity.HIGH:
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case ErrorSeverity.CRITICAL:
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Animation duration
  };

  const handleRetry = () => {
    onRetry?.(notification.id);
    notification.onRetry?.();
  };

  if (!isVisible && !isExiting) return null;

  const canRetry = error.recoveryStrategy === RecoveryStrategy.RETRY && error.actionable;
  const showActions = canRetry || error.actionable;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
    >
      <div className={`
        rounded-lg border shadow-lg p-4
        ${getSeverityStyles(error.severity)}
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getSeverityIcon(error.severity)}
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold">
              {error.type.replace(/_/g, ' ')}
            </h3>
            <p className="text-sm mt-1">
              {error.userMessage}
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer hover:underline">
                  Technical Details
                </summary>
                <pre className="text-xs mt-1 bg-black/10 p-2 rounded overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-3 text-current hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showActions && (
          <div className="mt-3 flex gap-2">
            {canRetry && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md
                  bg-current/10 hover:bg-current/20 transition-colors"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </button>
            )}
            
            {error.actionable && error.recoveryStrategy === RecoveryStrategy.USER_ACTION && (
              <button
                onClick={() => {
                  // Emit custom event for specific user action handling
                  window.dispatchEvent(new CustomEvent('autotest:user-action', {
                    detail: { error }
                  }));
                }}
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md
                  bg-current/10 hover:bg-current/20 transition-colors"
              >
                Take Action
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Error Toast Container
interface ErrorToastContainerProps {
  maxToasts?: number;
}

export const ErrorToastContainer: React.FC<ErrorToastContainerProps> = ({ 
  maxToasts = 3 
}) => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  useEffect(() => {
    const handleError = (event: CustomEvent) => {
      const { error, recovered } = event.detail;
      
      // Don't show toast for recovered errors unless they're critical
      if (recovered && error.severity !== ErrorSeverity.CRITICAL) {
        return;
      }

      const notification: ErrorNotification = {
        id: error.id,
        error,
        isVisible: true,
        autoHide: error.severity !== ErrorSeverity.CRITICAL,
        onRetry: () => {
          // Emit retry event
          window.dispatchEvent(new CustomEvent('autotest:retry', {
            detail: { error }
          }));
        }
      };

      setNotifications(prev => {
        const updated = [notification, ...prev];
        // Keep only the most recent notifications
        return updated.slice(0, maxToasts);
      });
    };

    window.addEventListener('autotest:error', handleError as EventListener);
    
    return () => {
      window.removeEventListener('autotest:error', handleError as EventListener);
    };
  }, [maxToasts]);

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleRetry = (id: string) => {
    // Keep the notification but emit retry event
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      window.dispatchEvent(new CustomEvent('autotest:retry', {
        detail: { error: notification.error }
      }));
    }
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 4}px)`,
            zIndex: 50 - index
          }}
        >
          <ErrorToast
            notification={notification}
            onDismiss={handleDismiss}
            onRetry={handleRetry}
          />
        </div>
      ))}
    </div>
  );
};

// Error Fallback Component for Error Boundaries
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  errorInfo 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        
        <div className="mt-4 text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            An unexpected error occurred. Our team has been notified.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={resetError}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md 
              hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md 
              hover:bg-gray-200 transition-colors font-medium"
          >
            Refresh Page
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </button>
            
            {showDetails && (
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                <div className="font-semibold">Error:</div>
                <div className="mt-1 text-red-600">{error.message}</div>
                
                {error.stack && (
                  <>
                    <div className="mt-2 font-semibold">Stack Trace:</div>
                    <pre className="mt-1 whitespace-pre-wrap break-words">
                      {error.stack}
                    </pre>
                  </>
                )}
                
                {errorInfo?.componentStack && (
                  <>
                    <div className="mt-2 font-semibold">Component Stack:</div>
                    <pre className="mt-1 whitespace-pre-wrap break-words">
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Error ID: {error.name}-{Date.now().toString(36)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default {
  ErrorToast,
  ErrorToastContainer,
  ErrorFallback
};