import { motion } from 'framer-motion';
import { Menu, Moon, Sun, Settings, Bell } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { ConnectionStatus, SyncStatus } from '../OfflineIndicator';

export const Header = () => {
  const { theme, setTheme, toggleSidebar, aiEnabled, recording } = useAppStore();

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <div className="flex items-center justify-between h-full px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="glass-button p-2 rounded-lg"
        >
          <Menu className="w-5 h-5 text-white" />
        </motion.button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AT</span>
          </div>
          <h1 className="text-white font-bold text-xl">Web AutoTest Pro</h1>
        </div>
      </div>

      {/* Center Section - Status */}
      <div className="flex items-center gap-4">
        {recording.isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="recording-indicator"
          >
            <div className="recording-pulse" />
            <span className="text-sm font-medium">
              {recording.isPaused ? 'Paused' : 'Recording'}
            </span>
          </motion.div>
        )}
        
        {aiEnabled && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-sm font-medium">AI Active</span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Connection and Sync Status */}
        <div className="hidden md:flex flex-col items-end gap-1">
          <ConnectionStatus />
          <SyncStatus />
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-button p-2 rounded-lg relative"
          >
            <Bell className="w-5 h-5 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">3</span>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleThemeToggle}
            className="glass-button p-2 rounded-lg"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-white" />
            ) : (
              <Moon className="w-5 h-5 text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-button p-2 rounded-lg"
          >
            <Settings className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};