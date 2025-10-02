import { motion } from 'framer-motion';
import { Download, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

export const Reports = () => {
  const { executions } = useAppStore();

  const stats = {
    totalExecutions: executions.length,
    passRate: executions.length > 0 
      ? Math.round((executions.filter(e => e.status === 'passed').length / executions.length) * 100)
      : 0,
    avgExecutionTime: executions.length > 0
      ? Math.round(executions.reduce((sum, e) => sum + (e.metrics?.totalTime || 0), 0) / executions.length / 1000)
      : 0
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Test Reports</h1>
            <p className="text-gray-300">
              Comprehensive analytics and insights for your test executions
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-button flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-morphism p-6"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalExecutions}</p>
              <p className="text-sm text-gray-400">Total Executions</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-morphism p-6"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.passRate}%</p>
              <p className="text-sm text-gray-400">Pass Rate</p>
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
            <FileText className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.avgExecutionTime}s</p>
              <p className="text-sm text-gray-400">Avg Duration</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Report Generation */}
      <div className="glass-morphism p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Generate Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['PDF', 'HTML', 'JSON', 'CSV'].map((format) => (
            <motion.button
              key={format}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-button justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as {format}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};