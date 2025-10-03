import { TestCase, TestExecution } from './types';\n\n/**\n * Performance Monitoring and Caching Service\n * Provides intelligent caching, performance metrics, and optimization recommendations\n */\n\nexport interface ExecutionOptions {\n  browser?: string;\n  viewport?: { width: number; height: number };\n  timeout?: number;\n  headless?: boolean;\n  options?: Record<string, unknown>;\n}\n\nexport interface ExecutionKeyData {\n  testCaseId: string;\n  browser?: string;\n  viewport?: { width: number; height: number };\n  options?: Record<string, unknown>;\n}

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: number;
  cpuUsage?: number;
  networkRequests: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
  size: number;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalEntries: number;
  totalSize: number;
  evictions: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isCleanedUp = false;

  constructor() {
    this.setupPerformanceObservers();
    this.setupAutoCleanup();
  }

  private setupPerformanceObservers() {
    // Monitor navigation timing
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.recordResourceMetrics(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }
  }

  startMeasurement(operationId: string): void {
    const startTime = performance.now();
    this.metrics.set(operationId, {
      startTime,
      endTime: 0,
      duration: 0,
      memoryUsage: this.getMemoryUsage(),
      networkRequests: 0,
      cacheHits: 0,
      cacheMisses: 0
    });
  }

  endMeasurement(operationId: string): PerformanceMetrics | null {
    const metric = this.metrics.get(operationId);
    if (!metric) return null;

    const endTime = performance.now();
    metric.endTime = endTime;
    metric.duration = endTime - metric.startTime;

    return metric;
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      ttfb: entry.responseStart - entry.requestStart,
      domLoad: entry.domContentLoadedEventEnd - entry.fetchStart,
      windowLoad: entry.loadEventEnd - entry.fetchStart
    };

    console.log('Navigation Performance:', metrics);
  }

  private recordResourceMetrics(entry: PerformanceResourceTiming) {
    if (entry.duration > 1000) { // Resources taking longer than 1s
      console.warn(`Slow resource detected: ${entry.name} (${entry.duration}ms)`);
    }
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  getMetrics(operationId: string): PerformanceMetrics | null {
    return this.metrics.get(operationId) || null;
  }

  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  private setupAutoCleanup(): void {
    // Clean up old metrics every 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldMetrics();
    }, 5 * 60 * 1000);
  }

  cleanupOldMetrics(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [key, metric] of this.metrics.entries()) {
      if (now - metric.startTime > maxAge) {
        this.metrics.delete(key);
      }
    }
  }

  cleanup(): void {
    if (this.isCleanedUp) return;
    
    this.isCleanedUp = true;
    
    // Disconnect all performance observers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting performance observer:', error);
      }
    });
    this.observers = [];
    
    // Clear all metrics
    this.metrics.clear();
    
    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export class IntelligentCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private maxMemory: number;
  private currentMemory: number = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;
  private metrics: CacheMetrics = {
    hitRate: 0,
    missRate: 0,
    totalEntries: 0,
    totalSize: 0,
    evictions: 0
  };

  constructor(maxSize: number = 1000, maxMemoryMB: number = 50) {
    this.maxSize = maxSize;
    this.maxMemory = maxMemoryMB * 1024 * 1024; // Convert to bytes
    this.setupPeriodicCleanup();
  }

  private setupPeriodicCleanup(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.evictExpired();
      }
    }, 5 * 60 * 1000);
  }

  set(key: string, data: T, ttl: number = 3600000): void { // Default 1 hour TTL
    const size = this.estimateSize(data);
    
    // Check if we need to evict entries
    this.evictIfNecessary(size);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now(),
      size
    };

    this.cache.set(key, entry);
    this.currentMemory += size;
    this.updateMetrics();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.missRate++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.metrics.missRate++;
      return null;
    }

    // Update access info
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.metrics.hitRate++;

    return entry.data;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemory -= entry.size;
      this.cache.delete(key);
      this.updateMetrics();
      return true;
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.currentMemory = 0;
    this.updateMetrics();
  }

  destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Clear all cache entries
    this.clear();
  }

  private evictIfNecessary(newEntrySize: number): void {
    // Evict expired entries first
    this.evictExpired();

    // If still need space, use LRU eviction
    while (
      (this.cache.size >= this.maxSize || 
       this.currentMemory + newEntrySize > this.maxMemory) &&
      this.cache.size > 0
    ) {
      this.evictLRU();
    }
  }

  evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let lruKey = '';
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
      this.metrics.evictions++;
    }
  }

  private estimateSize(data: T): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default size if can't stringify
    }
  }

  private updateMetrics(): void {
    this.metrics.totalEntries = this.cache.size;
    this.metrics.totalSize = this.currentMemory;
    
    const totalRequests = this.metrics.hitRate + this.metrics.missRate;
    if (totalRequests > 0) {
      this.metrics.hitRate = this.metrics.hitRate / totalRequests;
      this.metrics.missRate = this.metrics.missRate / totalRequests;
    }
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  // Advanced cache operations
  warmup(keys: string[], dataProvider: (key: string) => Promise<T>): Promise<void> {
    const promises = keys.map(async key => {
      try {
        const data = await dataProvider(key);
        this.set(key, data);
      } catch (error) {
        console.warn(`Cache warmup failed for key ${key}:`, error);
      }
    });

    return Promise.all(promises).then(() => {});
  }

  getOrSet(key: string, dataProvider: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    return dataProvider().then(data => {
      this.set(key, data, ttl);
      return data;
    });
  }
}

// Service implementations for test execution caching
export class TestExecutionCache extends IntelligentCache<TestExecution> {
  constructor() {
    super(500, 100); // 500 entries, 100MB max
  }

  cacheExecution(execution: TestExecution): void {
    const key = this.generateExecutionKey(execution);
    // Cache for 1 hour
    this.set(key, execution, 3600000);
  }

  getCachedExecution(testCase: TestCase, options: ExecutionOptions): TestExecution | null {
    const key = this.generateExecutionKey({ testCaseId: testCase.id, ...options });
    return this.get(key);
  }

  private generateExecutionKey(data: ExecutionKeyData | TestExecution): string {
    const keyData = {
      testCaseId: 'testCaseId' in data ? data.testCaseId : (data as any).testCaseId,
      browser: 'browser' in data ? data.browser : undefined,
      viewport: 'viewport' in data ? data.viewport : undefined,
      options: 'options' in data ? data.options : undefined
    };
    return `execution_${JSON.stringify(keyData)}`;
  }
}

// Singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const testExecutionCache = new TestExecutionCache();
export const generalCache = new IntelligentCache<unknown>(1000, 200);

// Comprehensive cleanup on page unload
if (typeof window !== 'undefined') {
  const cleanup = () => {
    performanceMonitor.cleanup();
    testExecutionCache.destroy();
    generalCache.destroy();
  };

  // Multiple cleanup events for better coverage
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Partial cleanup when page becomes hidden
      performanceMonitor.cleanupOldMetrics();
    }
  });

  // Cleanup after 30 minutes of inactivity
  let inactivityTimer: NodeJS.Timeout | null = null;
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    inactivityTimer = setTimeout(() => {
      console.log('Cleaning up due to inactivity');
      performanceMonitor.cleanupOldMetrics();
      generalCache.evictExpired();
    }, 30 * 60 * 1000); // 30 minutes
  };

  // Reset timer on user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, { passive: true });
  });

  resetInactivityTimer();
}