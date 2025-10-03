import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Shield } from 'lucide-react';

interface AIErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

interface AIErrorBoundaryProps {
  children: ReactNode;
  maxRetries?: number;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface ErrorReport {
  error: string;
  stack?: string;
  componentStack: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  retryCount: number;
}

/**
 * AI Error Boundary Component
 * Catches and handles errors specifically in AI-related components
 * Provides retry functionality and error reporting
 */
export class AIErrorBoundary extends Component<AIErrorBoundaryProps, AIErrorBoundaryState> {
  private maxRetries: number;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: AIErrorBoundaryProps) {
    super(props);
    this.maxRetries = props.maxRetries || 3;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AIErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Report error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🤖 AI Error Boundary - Error Caught');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentWillUnmount() {
    // Clean up any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private async reportError(error: Error, errorInfo: React.ErrorInfo): Promise<void> {
    try {
      const errorReport: ErrorReport = {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack || 'Not available',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        retryCount: this.state.retryCount
      };

      // Send to error tracking service (implement based on your service)
      await this.sendErrorReport(errorReport);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    // This is a placeholder - implement based on your error tracking service
    // Examples: Sentry, LogRocket, Bugsnag, or custom endpoint
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Error Report (Dev Mode):', report);
      return;
    }

    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        throw new Error(`Error reporting failed: ${response.statusText}`);
      }
    } catch (error) {
      // Fallback to console logging if service is unavailable
      console.error('Error reporting service unavailable:', error);
      console.error('Original error report:', report);
    }
  }

  private getCurrentUserId(): string | undefined {
    // Implement user ID retrieval based on your auth system
    return localStorage.getItem('userId') || undefined;
  }

  private getSessionId(): string {
    // Implement session ID retrieval/generation
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private handleRetry = (): void => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Add progressive delay between retries
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Max 10 seconds

    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
    }, retryDelay);

    this.retryTimeouts.push(timeout);
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private getErrorType(error: Error): string {
    if (error.name === 'ChunkLoadError') {
      return 'chunk-load';
    }
    if (error.message.includes('AI') || error.message.includes('model')) {
      return 'ai-service';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'network';
    }
    return 'unknown';
  }

  private renderErrorMessage(): ReactNode {
    const { error } = this.state;
    if (!error) return null;

    const errorType = this.getErrorType(error);

    switch (errorType) {
      case 'ai-service':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Bug className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              AI Service Temporarily Unavailable
            </h2>
            <p className="text-gray-600 mb-4">
              We're experiencing issues with our AI features. This is usually temporary.
            </p>
          </div>
        );

      case 'chunk-load':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Update Required
            </h2>
            <p className="text-gray-600 mb-4">
              A new version is available. Please refresh the page to continue.
            </p>
          </div>
        );

      case 'network':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connection Issue
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to connect to our services. Please check your internet connection.
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something Went Wrong
            </h2>
            <p className="text-gray-600 mb-4">
              An unexpected error occurred. Our team has been notified.
            </p>
          </div>
        );
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent && this.state.error) {
        const FallbackComponent = this.props.fallbackComponent;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              {this.renderErrorMessage()}

              <div className="mt-6 space-y-3">
                {/* Retry Button */}
                {this.state.retryCount < this.maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {this.state.isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                      </>
                    )}
                  </button>
                )}

                {/* Reload Button */}
                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </button>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Technical Details (Dev Mode)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded-md">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">
                      <strong>Error:</strong> {this.state.error.message}
                      {this.state.error.stack && (
                        <>
                          <br />
                          <br />
                          <strong>Stack:</strong>
                          <br />
                          {this.state.error.stack}
                        </>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <>
                          <br />
                          <br />
                          <strong>Component Stack:</strong>
                          <br />
                          {this.state.errorInfo.componentStack}
                        </>
                      )}
                    </pre>
                  </div>
                </details>
              )}

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  If this problem persists, please contact support with error ID: {this.getSessionId().slice(0, 8)}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AIErrorBoundary;