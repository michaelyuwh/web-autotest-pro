import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
      <div className="text-center">
        {/* Animated spinner */}
        <motion.div
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Loading text with pulse animation */}
        <motion.p
          className="text-lg font-medium text-gray-700 dark:text-gray-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading Web AutoTest Pro...
        </motion.p>
        
        {/* Subtitle */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Preparing your testing environment
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;