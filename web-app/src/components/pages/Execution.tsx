import { motion } from 'framer-motion';
import { Play, Pause, RefreshCw, CheckCircle2, XCircle, Clock, Monitor } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import TestExecution from '../TestExecution';

export const Execution = () => {
  const { executions, activeExecution, testCases, activeTestCase, setActiveTestCase } = useAppStore();

  return (
    <div className="h-full flex">
      {/* Sidebar with test cases */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Test Cases</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Select a test to execute</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {testCases.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No test cases available</p>
              <p className="text-sm text-gray-400 mt-1">Create some tests first</p>
            </div>
          ) : (
            testCases.map((testCase) => {
              const lastExecution = executions
                .filter(exec => exec.testCaseId === testCase.id)
                .sort((a, b) => b.startTime - a.startTime)[0];

              const isActive = activeTestCase?.id === testCase.id;
              
              return (
                <motion.button
                  key={testCase.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTestCase(testCase)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {testCase.name}
                    </h3>
                    {lastExecution && (
                      <div className="ml-2 flex-shrink-0">
                        {lastExecution.status === 'passed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : lastExecution.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : lastExecution.status === 'running' ? (
                          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {testCase.steps.length} steps • {testCase.tags.join(', ') || 'No tags'}
                  </div>
                  
                  {lastExecution && (
                    <div className="text-xs text-gray-400 mt-1">
                      Last run: {new Date(lastExecution.startTime).toLocaleDateString()}
                    </div>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Main execution area */}
      <div className="flex-1 min-w-0">
        <TestExecution 
          testCase={activeTestCase} 
          onClose={() => setActiveTestCase(null)}
        />
      </div>
    </div>
  );
};