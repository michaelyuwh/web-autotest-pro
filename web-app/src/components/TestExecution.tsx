import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Settings, 
  Monitor, 
  Smartphone, 
  Tablet,
  Camera,
  Video,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause
} from 'lucide-react';
import { TestCase, ExecutionStatus } from '@web-autotest-pro/shared';
import { useTestExecution } from '../services/testExecutionService';
import { ExecutionOptions } from '../services/playwrightExecutorMock';

interface TestExecutionProps {
  testCase: TestCase | null;
  onClose?: () => void;
}

const TestExecution: React.FC<TestExecutionProps> = ({ testCase, onClose }) => {
  const { executions, executeTest, cancelTest } = useTestExecution();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOptions, setExecutionOptions] = useState<Partial<ExecutionOptions>>({
    browser: 'chromium',
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshots: true,
    video: false,
    slowMotion: 200
  });

  const currentExecution = testCase ? 
    executions.find(exec => exec.testCaseId === testCase.id && exec.status === ExecutionStatus.RUNNING) : 
    null;

  const lastExecution = testCase ? 
    executions
      .filter(exec => exec.testCaseId === testCase.id)
      .sort((a, b) => b.startTime - a.startTime)[0] : 
    null;

  const handleExecute = useCallback(async () => {
    if (!testCase || isExecuting) return;

    setIsExecuting(true);
    try {
      await executeTest(testCase, executionOptions);
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [testCase, executionOptions, executeTest, isExecuting]);

  const handleCancel = useCallback(async () => {
    if (!currentExecution) return;

    try {
      await cancelTest(currentExecution.id);
      setIsExecuting(false);
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  }, [currentExecution, cancelTest]);

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.RUNNING:
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case ExecutionStatus.COMPLETED:
      case ExecutionStatus.PASSED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case ExecutionStatus.FAILED:
      case ExecutionStatus.ERROR:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case ExecutionStatus.CANCELLED:
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.RUNNING:
        return 'text-blue-500 bg-blue-50 border-blue-200';
      case ExecutionStatus.COMPLETED:
      case ExecutionStatus.PASSED:
        return 'text-green-500 bg-green-50 border-green-200';
      case ExecutionStatus.FAILED:
      case ExecutionStatus.ERROR:
        return 'text-red-500 bg-red-50 border-red-200';
      case ExecutionStatus.CANCELLED:
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  if (!testCase) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a test case to execute</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test Execution
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {testCase.name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {currentExecution ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Cancel
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExecute}
              disabled={isExecuting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isExecuting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isExecuting ? 'Executing...' : 'Execute Test'}
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Execution Settings */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Browser Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Browser
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['chromium', 'firefox', 'webkit'] as const).map((browser) => (
                  <button
                    key={browser}
                    onClick={() => setExecutionOptions(prev => ({ ...prev, browser }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      executionOptions.browser === browser
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium capitalize">{browser}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Viewport Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Viewport
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Desktop', icon: Monitor, size: { width: 1280, height: 720 } },
                  { name: 'Tablet', icon: Tablet, size: { width: 768, height: 1024 } },
                  { name: 'Mobile', icon: Smartphone, size: { width: 375, height: 667 } }
                ].map((viewport) => (
                  <button
                    key={viewport.name}
                    onClick={() => setExecutionOptions(prev => ({ ...prev, viewport: viewport.size }))}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      executionOptions.viewport?.width === viewport.size.width
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <viewport.icon className="w-5 h-5" />
                    <span className="text-xs">{viewport.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Options
              </label>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!executionOptions.headless}
                    onChange={(e) => setExecutionOptions(prev => ({ ...prev, headless: !e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show browser window</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={executionOptions.screenshots}
                    onChange={(e) => setExecutionOptions(prev => ({ ...prev, screenshots: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Camera className="w-4 h-4" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Take screenshots</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={executionOptions.video}
                    onChange={(e) => setExecutionOptions(prev => ({ ...prev, video: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Video className="w-4 h-4" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Record video</span>
                </label>
              </div>

              {/* Slow Motion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slow Motion: {executionOptions.slowMotion}ms
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="100"
                  value={executionOptions.slowMotion}
                  onChange={(e) => setExecutionOptions(prev => ({ ...prev, slowMotion: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Execution Status & Results */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Current Execution Status */}
            {(currentExecution || lastExecution) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Execution Status
                </h3>
                
                {currentExecution && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(currentExecution.status)}
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          Test Running...
                        </span>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {Math.round((Date.now() - currentExecution.startTime) / 1000)}s
                      </div>
                    </div>
                    
                    {currentExecution.steps && (
                      <div className="space-y-2">
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Step {currentExecution.steps.filter(s => s.status !== 'pending').length} of {currentExecution.steps.length}
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(currentExecution.steps.filter(s => s.status !== 'pending').length / currentExecution.steps.length) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {lastExecution && !currentExecution && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${getStatusColor(lastExecution.status)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(lastExecution.status)}
                        <span className="font-medium">
                          Last Execution: {lastExecution.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        {lastExecution.duration ? `${Math.round(lastExecution.duration / 1000)}s` : 'N/A'}
                      </div>
                    </div>
                    
                    {lastExecution.error && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-300">{lastExecution.error}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Test Steps Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Test Steps ({testCase.steps.length})
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testCase.steps.map((step, index) => {
                  const executionStep = currentExecution?.steps?.find(s => s.action.id === step.id);
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-lg border ${
                        executionStep
                          ? getStatusColor(executionStep.status as ExecutionStatus)
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {step.type.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {step.description || step.selector}
                          </div>
                        </div>
                        {executionStep && getStatusIcon(executionStep.status as ExecutionStatus)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestExecution;