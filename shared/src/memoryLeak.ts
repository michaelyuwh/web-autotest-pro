/**
 * Memory Leak Prevention Service
 * Provides advanced memory management and leak detection for the application
 */

export interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
  timestamp: number;
}

export interface LeakDetectionResult {
  leakDetected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: {
    memoryGrowth: number;
    suspiciousObjects: string[];
    recommendations: string[];
  };
}

export class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;
  private memoryHistory: MemoryInfo[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private gcCallbacks = new Set<() => void>();
  private weakRefs = new Set<WeakRef<object>>();

  private constructor() {
    this.setupMemoryMonitoring();
  }

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector();
    }
    return MemoryLeakDetector.instance;
  }

  private setupMemoryMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Monitor memory usage every 30 seconds
      this.monitoringInterval = setInterval(() => {
        this.recordMemoryUsage();
        this.checkForLeaks();
        this.cleanupWeakRefs();
      }, 30000);

      this.isMonitoring = true;

      // Force garbage collection periodically if available
      if ('gc' in window && typeof (window as any).gc === 'function') {
        setInterval(() => {
          try {
            (window as any).gc();
            this.gcCallbacks.forEach(callback => {
              try {
                callback();
              } catch (error) {
                console.warn('GC callback error:', error);
              }
            });
          } catch (error) {
            console.warn('Manual GC failed:', error);
          }
        }, 5 * 60 * 1000); // Every 5 minutes
      }
    }
  }

  private recordMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const memoryInfo: MemoryInfo = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        timestamp: Date.now()
      };

      this.memoryHistory.push(memoryInfo);

      // Keep only last 20 entries (10 minutes of data at 30s intervals)
      if (this.memoryHistory.length > 20) {
        this.memoryHistory.shift();
      }
    }
  }

  private checkForLeaks(): LeakDetectionResult {
    if (this.memoryHistory.length < 5) {
      return {
        leakDetected: false,
        severity: 'low',
        details: {
          memoryGrowth: 0,
          suspiciousObjects: [],
          recommendations: []
        }
      };
    }

    const recent = this.memoryHistory.slice(-5);
    const growth = recent[recent.length - 1].used - recent[0].used;
    const growthRate = growth / (5 * 30); // MB per second
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const suspiciousObjects: string[] = [];
    const recommendations: string[] = [];

    // Analyze growth patterns
    if (growthRate > 1000000) { // > 1MB per second
      severity = 'critical';
      recommendations.push('Immediate investigation required - extreme memory growth detected');
    } else if (growthRate > 500000) { // > 500KB per second
      severity = 'high';
      recommendations.push('Significant memory leak detected - review recent code changes');
    } else if (growthRate > 100000) { // > 100KB per second
      severity = 'medium';
      recommendations.push('Moderate memory growth detected - monitor closely');
    }

    // Check for common leak patterns
    if (this.detectEventListenerLeaks()) {
      suspiciousObjects.push('Event Listeners');
      recommendations.push('Check for unremoved event listeners');
    }

    if (this.detectTimerLeaks()) {
      suspiciousObjects.push('Timers/Intervals');
      recommendations.push('Check for uncleaned timers and intervals');
    }

    if (this.detectDOMNodeLeaks()) {
      suspiciousObjects.push('DOM Nodes');
      recommendations.push('Check for detached DOM nodes or circular references');
    }

    const leakDetected = severity !== 'low' || suspiciousObjects.length > 0;

    if (leakDetected) {
      console.warn('Memory leak detected:', { severity, growth: growthRate, suspiciousObjects });
    }

    return {
      leakDetected,
      severity,
      details: {
        memoryGrowth: growth,
        suspiciousObjects,
        recommendations
      }
    };
  }

  private detectEventListenerLeaks(): boolean {
    // Check for excessive event listeners (heuristic)
    if (typeof window !== 'undefined') {
      const eventTargets = [window, document, document.body];
      return eventTargets.some(target => {
        // This is a rough heuristic - in practice, you'd need more sophisticated detection
        const listeners = (target as any)._listeners;
        return listeners && Object.keys(listeners).length > 50;
      });
    }
    return false;
  }

  private detectTimerLeaks(): boolean {
    // Check for excessive timers (this is a simplified check)
    const timerCount = (window as any)._activeTimers?.size || 0;
    return timerCount > 20;
  }

  private detectDOMNodeLeaks(): boolean {
    // Check for excessive DOM nodes
    if (typeof document !== 'undefined') {
      const nodeCount = document.querySelectorAll('*').length;
      return nodeCount > 10000; // Arbitrary threshold
    }
    return false;
  }

  private cleanupWeakRefs(): void {
    for (const weakRef of this.weakRefs) {
      if (weakRef.deref() === undefined) {
        this.weakRefs.delete(weakRef);
      }
    }
  }

  // Public API
  registerObject(obj: object): WeakRef<object> {
    const weakRef = new WeakRef(obj);
    this.weakRefs.add(weakRef);
    return weakRef;
  }

  onGarbageCollection(callback: () => void): () => void {
    this.gcCallbacks.add(callback);
    return () => {
      this.gcCallbacks.delete(callback);
    };
  }

  getMemoryHistory(): MemoryInfo[] {
    return [...this.memoryHistory];
  }

  getCurrentMemoryInfo(): MemoryInfo | null {
    if (this.memoryHistory.length > 0) {
      return this.memoryHistory[this.memoryHistory.length - 1];
    }
    return null;
  }

  forceMemoryCheck(): LeakDetectionResult {
    this.recordMemoryUsage();
    return this.checkForLeaks();
  }

  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    this.memoryHistory = [];
    this.gcCallbacks.clear();
    this.weakRefs.clear();
  }
}

// Enhanced cleanup utilities
export class CleanupManager {
  private static cleanupTasks = new Set<() => void>();
  private static intervals = new Set<NodeJS.Timeout>();
  private static timeouts = new Set<NodeJS.Timeout>();
  private static eventListeners = new Map<EventTarget, Map<string, EventListener>>();

  static registerCleanupTask(task: () => void): () => void {
    this.cleanupTasks.add(task);
    return () => {
      this.cleanupTasks.delete(task);
    };
  }

  static trackInterval(interval: NodeJS.Timeout): void {
    this.intervals.add(interval);
  }

  static trackTimeout(timeout: NodeJS.Timeout): void {
    this.timeouts.add(timeout);
  }

  static trackEventListener(
    target: EventTarget,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): () => void {
    target.addEventListener(event, listener, options);
    
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map());
    }
    this.eventListeners.get(target)!.set(event, listener);

    return () => {
      target.removeEventListener(event, listener, options);
      const targetListeners = this.eventListeners.get(target);
      if (targetListeners) {
        targetListeners.delete(event);
        if (targetListeners.size === 0) {
          this.eventListeners.delete(target);
        }
      }
    };
  }

  static cleanup(): void {
    // Execute cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });

    // Clear intervals
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    this.intervals.clear();

    // Clear timeouts
    this.timeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.timeouts.clear();

    // Remove event listeners
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, event) => {
        try {
          target.removeEventListener(event, listener);
        } catch (error) {
          console.warn('Failed to remove event listener:', error);
        }
      });
    });
    this.eventListeners.clear();

    // Clear cleanup tasks
    this.cleanupTasks.clear();
  }
}

// Singleton instance
export const memoryLeakDetector = MemoryLeakDetector.getInstance();

// Setup global cleanup
if (typeof window !== 'undefined') {
  const globalCleanup = () => {
    CleanupManager.cleanup();
    memoryLeakDetector.cleanup();
  };

  window.addEventListener('beforeunload', globalCleanup);
  window.addEventListener('pagehide', globalCleanup);
}

// Export enhanced interval/timeout functions that auto-track
export const safeSetInterval = (callback: () => void, ms: number): NodeJS.Timeout => {
  const interval = setInterval(callback, ms);
  CleanupManager.trackInterval(interval);
  return interval;
};

export const safeSetTimeout = (callback: () => void, ms: number): NodeJS.Timeout => {
  const timeout = setTimeout(callback, ms);
  CleanupManager.trackTimeout(timeout);
  return timeout;
};

export const safeAddEventListener = (
  target: EventTarget,
  event: string,
  listener: EventListener,
  options?: AddEventListenerOptions
): (() => void) => {
  return CleanupManager.trackEventListener(target, event, listener, options);
};