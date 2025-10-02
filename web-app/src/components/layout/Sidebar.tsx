import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Video, 
  Play, 
  BarChart3, 
  Settings, 
  Bot,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
  { id: 'test-cases', label: 'Test Cases', icon: FileText, path: '/test-cases' },
  { id: 'recording', label: 'Recording', icon: Video, path: '/recording' },
  { id: 'execution', label: 'Execution', icon: Play, path: '/execution' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { layout, toggleSidebar, aiEnabled, recording } = useAppStore();
  const { sidebarCollapsed } = layout;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AT</span>
              </div>
              <span className="text-white font-semibold">Web AutoTest Pro</span>
            </motion.div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSidebar}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                    : 'hover:bg-white/10 text-gray-300 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
                
                {/* Recording indicator */}
                {item.id === 'recording' && recording.isRecording && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* AI Status */}
      {aiEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t border-white/10"
        >
          <div className={`flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}>
            <Bot className="w-5 h-5 text-green-400" />
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-green-300 text-sm font-medium">AI Assistant</p>
                <p className="text-green-400/70 text-xs">Ready to help</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {!sidebarCollapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-xs text-gray-500">Web AutoTest Pro v1.0.0</p>
            <p className="text-xs text-gray-600">AI-Powered Testing</p>
          </motion.div>
        ) : (
          <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto" />
        )}
      </div>
    </div>
  );
};