import { motion } from 'framer-motion';
import { Plus, Search, Filter, Play, Edit, Trash2 } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

export const TestCases = () => {
  const { testCases, deleteTestCase, setActiveTestCase } = useAppStore();

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-white">Test Cases</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="glass-button flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Test Case
        </motion.button>
      </motion.div>

      {/* Search and Filters */}
      <div className="glass-morphism p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search test cases..."
              className="glass-input w-full pl-10"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-button px-4 py-2"
          >
            <Filter className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Test Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testCases.map((testCase, index) => (
          <motion.div
            key={testCase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-morphism p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
            onClick={() => setActiveTestCase(testCase)}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                {testCase.name}
              </h3>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 hover:bg-blue-500/20 rounded"
                >
                  <Play className="w-4 h-4 text-blue-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 hover:bg-green-500/20 rounded"
                >
                  <Edit className="w-4 h-4 text-green-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTestCase(testCase.id);
                  }}
                  className="p-1 hover:bg-red-500/20 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </motion.button>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {testCase.description || 'No description'}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{testCase.steps.length} steps</span>
              <span>{new Date(testCase.updatedAt).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {testCases.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-morphism p-12 text-center"
        >
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No test cases yet</h3>
          <p className="text-gray-400 mb-6">Create your first test case to get started</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Test Case
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};