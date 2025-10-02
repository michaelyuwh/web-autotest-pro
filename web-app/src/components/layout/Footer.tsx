import { motion } from 'framer-motion';
import { Wifi, WifiOff, Database, Cpu, Globe } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

export const Footer = () => {
  const { aiEnabled, aiLoading, testCases, executions } = useAppStore();
  const isOnline = navigator.onLine;
  
  return (
    <div className="flex items-center justify-between h-full px-6">
      {/* Left Section - Status */}
      <div className="flex items-center gap-6">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm">Offline</span>
            </>
          )}
        </div>

        {/* Storage Info */}
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="text-blue-300 text-sm">
            {testCases.length} tests • {executions.length} runs
          </span>
        </div>

        {/* AI Status */}
        {aiEnabled && (
          <div className="flex items-center gap-2">
            <motion.div
              animate={aiLoading ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: aiLoading ? Infinity : 0, ease: "linear" }}
            >
              <Cpu className={`w-4 h-4 ${
                aiLoading ? 'text-yellow-400' : 'text-green-400'
              }`} />
            </motion.div>
            <span className={`text-sm ${
              aiLoading ? 'text-yellow-300' : 'text-green-300'
            }`}>
              AI {aiLoading ? 'Processing...' : 'Ready'}
            </span>
          </div>
        )}
      </div>

      {/* Center Section - Browser Info */}
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-gray-400" />
        <span className="text-gray-300 text-sm">
          {navigator.userAgent.includes('Chrome') ? 'Chrome' :
           navigator.userAgent.includes('Firefox') ? 'Firefox' :
           navigator.userAgent.includes('Safari') ? 'Safari' :
           navigator.userAgent.includes('Edge') ? 'Edge' : 'Unknown'}
        </span>
      </div>

      {/* Right Section - Version */}
      <div className="text-right">
        <p className="text-xs text-gray-400">AutoTest Pro v1.0.0</p>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};