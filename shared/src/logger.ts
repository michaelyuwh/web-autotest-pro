// Production-ready logging utility
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    };
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry = this.createLogEntry(level, message, context, error);
    
    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (this.isDevelopment || level === 'error') {
      const logMethod = level === 'error' ? console.error : 
                      level === 'warn' ? console.warn :
                      level === 'info' ? console.info : console.debug;
      
      const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
      const errorStr = error ? ` | Error: ${error.message}` : '';
      
      logMethod(`[${level.toUpperCase()}] ${message}${contextStr}${errorStr}`);
      
      if (error && error.stack) {
        console.error(error.stack);
      }
    }

    // Send to external logging service in production
    if (!this.isDevelopment && (level === 'error' || level === 'warn')) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    try {
      // In a real application, send to services like Sentry, LogRocket, etc.
      if (typeof window !== 'undefined' && 'navigator' in window && 'sendBeacon' in navigator) {
        const data = JSON.stringify(entry);
        navigator.sendBeacon('/api/logs', data);
      }
    } catch (error) {
      // Silently fail to avoid infinite loops
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return [...this.logs];
    return this.logs.filter(log => log.level === level);
  }

  clearLogs() {
    this.logs = [];
  }

  // Performance monitoring
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Group logging for better organization
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();

// Convenience methods for different components
export const webAppLogger = {
  aiService: (message: string, context?: Record<string, unknown>) => 
    logger.info(`[AI Service] ${message}`, context),
  testExecution: (message: string, context?: Record<string, unknown>) => 
    logger.info(`[Test Execution] ${message}`, context),
  recorder: (message: string, context?: Record<string, unknown>) => 
    logger.info(`[Recorder] ${message}`, context),
  pwa: (message: string, context?: Record<string, unknown>) => 
    logger.info(`[PWA] ${message}`, context),
};

export const extensionLogger = {
  background: (message: string, context?: Record<string, unknown>) => 
    logger.info(`[Extension Background] ${message}`, context),
  content: (message: string, context?: Record<string, unknown>) => 
    logger.info(`[Extension Content] ${message}`, context),
  popup: (message: string, context?: Record<string, unknown>) => 
    logger.info(`[Extension Popup] ${message}`, context),
};

export const mobileLogger = {
  sync: (message: string, context?: Record<string, unknown>) => 
    logger.info(`[Mobile Sync] ${message}`, context),
  realtime: (message: string, context?: Record<string, unknown>) => 
    logger.info(`[Mobile Realtime] ${message}`, context),
  dashboard: (message: string, context?: Record<string, unknown>) => 
    logger.info(`[Mobile Dashboard] ${message}`, context),
};