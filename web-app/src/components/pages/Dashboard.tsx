import { motion } from 'framer-motion';
import { Play, Plus, FileText, BarChart3, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

export const Dashboard = () => {
  const { testCases, executions, recording, setActivePanel } = useAppStore();

  const recentExecutions = executions.slice(-5);
  const stats = {
    totalTests: testCases.length,
    passedTests: executions.filter(e => e.status === 'passed').length,
    failedTests: executions.filter(e => e.status === 'failed').length,
    avgExecutionTime: executions.length > 0 
      ? Math.round(executions.reduce((sum, e) => sum + (e.metrics?.totalTime || 0), 0) / executions.length / 1000)
      : 0
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism p-6"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to AutoTest Pro</h1>
        <p className="text-gray-300">
          AI-powered browser testing tool with cross-browser support and real-time recording.
        </p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActivePanel('recording')}
          className="glass-morphism p-6 text-left group hover:bg-blue-500/10 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
              <Play className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">Start Recording</h3>
          </div>
          <p className="text-sm text-gray-400">
            Record a new test case with AI assistance
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActivePanel('test-cases')}
          className="glass-morphism p-6 text-left group hover:bg-green-500/10 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
              <Plus className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white">New Test Case</h3>
          </div>
          <p className="text-sm text-gray-400">
            Create a test case from scratch
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActivePanel('test-cases')}
          className="glass-morphism p-6 text-left group hover:bg-purple-500/10 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">My Test Cases</h3>
          </div>
          <p className="text-sm text-gray-400">
            Manage existing test cases
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActivePanel('reports')}
          className="glass-morphism p-6 text-left group hover:bg-orange-500/10 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
              <BarChart3 className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="font-semibold text-white">View Reports</h3>
          </div>
          <p className="text-sm text-gray-400">
            Analyze test results and metrics
          </p>
        </motion.button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-morphism p-6"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalTests}</p>
              <p className="text-sm text-gray-400">Total Tests</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-morphism p-6"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.passedTests}</p>
              <p className="text-sm text-gray-400">Passed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-morphism p-6"
        >
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.failedTests}</p>
              <p className="text-sm text-gray-400">Failed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-morphism p-6"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.avgExecutionTime}s</p>
              <p className="text-sm text-gray-400">Avg Time</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Executions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-morphism p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Recent Executions</h2>
          <div className="space-y-3">
            {recentExecutions.length > 0 ? (
              recentExecutions.map((execution, index) => (
                <motion.div
                  key={execution.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {execution.status === 'passed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : execution.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-400" />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        Test #{execution.id.slice(-6)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(execution.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {execution.metrics?.totalTime 
                      ? `${Math.round(execution.metrics.totalTime / 1000)}s`
                      : '-'
                    }
                  </span>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                No recent executions
              </p>
            )}
          </div>
        </motion.div>

        {/* Quick URL Entry */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-morphism p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Quick Start</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter URL to test
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                className="glass-input w-full"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-button w-full justify-center"
              disabled={recording.isRecording}
            >
              <Play className="w-4 h-4 mr-2" />
              {recording.isRecording ? 'Recording in Progress...' : 'Start Recording'}
            </motion.button>
            <p className="text-xs text-gray-400 text-center">
              Launch the URL in a new tab and start recording your test case
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};