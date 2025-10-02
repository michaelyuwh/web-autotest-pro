import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Moon, Sun, Cpu, Database, Shield, Download, Bell, Wifi, Smartphone } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { usePWA } from '../../hooks/usePWA';

export const Settings = () => {
  const { theme, setTheme, aiEnabled, toggleAI, liquidGlass } = useAppStore();
  const {
    isInstallable,
    isInstalled,
    hasNotificationPermission,
    isOnline,
    hasUpdateAvailable,
    installApp,
    applyUpdate,
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush
  } = usePWA();

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism p-6"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-300">
          Configure AutoTest Pro to match your preferences
        </p>
      </motion.div>

      {/* Theme Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-morphism p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          {theme === 'dark' ? (
            <Moon className="w-6 h-6 text-blue-400" />
          ) : (
            <Sun className="w-6 h-6 text-yellow-400" />
          )}
          <h2 className="text-xl font-semibold text-white">Appearance</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Theme
            </label>
            <div className="flex gap-3">
              {['light', 'dark', 'auto'].map((themeOption) => (
                <motion.button
                  key={themeOption}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTheme(themeOption as any)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    theme === themeOption
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'glass-morphism text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Glass Effect Transparency: {Math.round(liquidGlass.transparency * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={liquidGlass.transparency}
              className="w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* AI Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-morphism p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Enable AI Features</p>
              <p className="text-gray-400 text-sm">AI-powered test optimization and debugging</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleAI}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                aiEnabled ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <motion.div
                animate={{ x: aiEnabled ? 24 : 0 }}
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
              />
            </motion.button>
          </div>

          {aiEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 pl-4 border-l-2 border-blue-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Smart Suggestions</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Auto-optimization</span>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Error Analysis</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* PWA Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-morphism p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Progressive Web App</h2>
        </div>
        
        <div className="space-y-4">
          {/* App Installation */}
          {isInstallable && !isInstalled && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Install App</h3>
                  <p className="text-gray-300 text-sm">Install Web AutoTest Pro as a desktop app</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={installApp}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Install
                </motion.button>
              </div>
            </div>
          )}

          {isInstalled && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">App Installed</h3>
                  <p className="text-gray-300 text-sm">Web AutoTest Pro is installed as a PWA</p>
                </div>
              </div>
            </div>
          )}

          {/* App Update */}
          {hasUpdateAvailable && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Update Available</h3>
                  <p className="text-gray-300 text-sm">A new version is ready to install</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={applyUpdate}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Update Now
                </motion.button>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Notifications</h3>
              <p className="text-gray-300 text-sm">Get notified when tests complete</p>
            </div>
            <div className="flex items-center gap-3">
              {hasNotificationPermission ? (
                <div className="flex items-center gap-2 text-green-400">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">Enabled</span>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={requestNotificationPermission}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Enable
                </motion.button>
              )}
            </div>
          </div>

          {/* Push Notifications */}
          {hasNotificationPermission && (
            <div className="flex items-center justify-between pl-4 border-l-2 border-blue-500/30">
              <div>
                <h4 className="text-white font-medium">Push Notifications</h4>
                <p className="text-gray-300 text-sm">Receive notifications even when app is closed</p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={subscribeToPush}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Subscribe
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={unsubscribeFromPush}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Unsubscribe
                </motion.button>
              </div>
            </div>
          )}

          {/* Offline Status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Offline Support</h3>
              <p className="text-gray-300 text-sm">Access cached data when offline</p>
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Online</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Storage Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-morphism p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Storage & Data</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Auto-save Test Cases</p>
              <p className="text-gray-400 text-sm">Automatically save changes as you work</p>
            </div>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Video Recording</p>
              <p className="text-gray-400 text-sm">Record video during test execution</p>
            </div>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-button w-full justify-center bg-red-500/20 border-red-500/30 hover:bg-red-500/30"
          >
            Clear All Data
          </motion.button>
        </div>
      </motion.div>

      {/* Privacy Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-morphism p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-orange-400" />
          <h2 className="text-xl font-semibold text-white">Privacy & Security</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Mask Sensitive Data</p>
              <p className="text-gray-400 text-sm">Hide passwords and personal information</p>
            </div>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Analytics</p>
              <p className="text-gray-400 text-sm">Anonymous usage statistics</p>
            </div>
            <input type="checkbox" className="rounded" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};