import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Zap, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
// Simple logger utility for the component
const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance Monitor] ${message}`, context);
    }
  }
};

interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  testSuccess: boolean;
  stepsCompleted: number;
  totalSteps: number;
  errorCount: number;
  warningCount: number;
}

interface RealTimePerformanceMonitorProps {
  testId?: string;
  isActive: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const RealTimePerformanceMonitor: React.FC<RealTimePerformanceMonitorProps> = ({
  testId,
  isActive,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    executionTime: 0,
    memoryUsage: 0,
    testSuccess: false,
    stepsCompleted: 0,
    totalSteps: 0,
    errorCount: 0,
    warningCount: 0
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!isActive) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const executionTime = currentTime - startTime;

      // Get memory usage if available - use proper typing
      interface PerformanceMemory {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      }
      
      interface ExtendedPerformance extends Performance {
        memory?: PerformanceMemory;
      }
      
      const extendedPerformance = performance as ExtendedPerformance;
      const memoryUsage = extendedPerformance.memory 
        ? extendedPerformance.memory.usedJSHeapSize / (1024 * 1024) // Convert to MB
        : 0;

      const newMetrics: PerformanceMetrics = {
        ...metrics,
        executionTime,
        memoryUsage,
      };

      // Update performance history for the graph
      setPerformanceHistory(prev => {
        const updated = [...prev, memoryUsage].slice(-20); // Keep last 20 data points
        return updated;
      });

      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);

      logger.info('Performance metrics updated', {
        testId,
        executionTime,
        memoryUsage,
        stepsCompleted: newMetrics.stepsCompleted
      });
    }, 1000);

    // Cleanup function to prevent memory leaks
    return () => {
      clearInterval(interval);
      logger.info('Performance monitor cleanup', { testId });
    };
  }, [isActive, testId, onMetricsUpdate]); // Added onMetricsUpdate to dependencies

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatMemory = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)}KB`;
    return `${mb.toFixed(1)}MB`;
  };

  const getProgressPercentage = () => {
    if (metrics.totalSteps === 0) return 0;
    return (metrics.stepsCompleted / metrics.totalSteps) * 100;
  };

  const getPerformanceStatus = () => {
    if (metrics.errorCount > 0) return 'error';
    if (metrics.warningCount > 0) return 'warning';
    if (metrics.testSuccess) return 'success';
    return 'running';
  };

  const statusConfig = {
    error: { color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: AlertTriangle },
    success: { color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle2 },
    running: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Activity },
  };

  const status = getPerformanceStatus();
  const StatusIcon = statusConfig[status].icon;

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="glass-morphism rounded-lg overflow-hidden">
        {/* Compact View */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-4 w-full text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig[status].bg}`}>
              <StatusIcon className={`w-4 h-4 ${statusConfig[status].color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-white font-medium">
                  {formatTime(metrics.executionTime)}
                </span>
                <span className="text-gray-300">
                  {metrics.stepsCompleted}/{metrics.totalSteps}
                </span>
                <span className="text-gray-400">
                  {formatMemory(metrics.memoryUsage)}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="mt-2 w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Activity className="w-4 h-4 text-gray-400" />
            </motion.div>
          </div>
        </motion.button>

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-white/10"
            >
              <div className="p-4 space-y-4">
                {/* Detailed Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-300">Execution Time</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatTime(metrics.executionTime)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Memory Usage</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatMemory(metrics.memoryUsage)}
                    </div>
                  </div>
                </div>

                {/* Step Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Progress</span>
                    <span className="text-white">
                      {metrics.stepsCompleted} / {metrics.totalSteps} steps
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage()}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">
                    {getProgressPercentage().toFixed(0)}% complete
                  </div>
                </div>

                {/* Performance Graph */}
                {performanceHistory.length > 1 && (
                  <div className="space-y-2">
                    <span className="text-sm text-gray-300">Memory Usage Trend</span>
                    <div className="h-16 flex items-end gap-1">
                      {performanceHistory.map((value, index) => {
                        const maxValue = Math.max(...performanceHistory);
                        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                        
                        return (
                          <motion.div
                            key={index}
                            className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-sm"
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error/Warning Count */}
                {(metrics.errorCount > 0 || metrics.warningCount > 0) && (
                  <div className="flex items-center gap-4 text-sm">
                    {metrics.errorCount > 0 && (
                      <div className="flex items-center gap-1 text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span>{metrics.errorCount} errors</span>
                      </div>
                    )}
                    {metrics.warningCount > 0 && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{metrics.warningCount} warnings</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};