import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor, Wifi, WifiOff, Bell, RefreshCw } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const PWAPrompt: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isOnline,
    hasUpdateAvailable,
    hasNotificationPermission,
    installApp,
    applyUpdate,
    requestNotificationPermission
  } = usePWA();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        setIsDismissed(true);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await applyUpdate();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleNotificationPermission = async () => {
    try {
      await requestNotificationPermission();
    } catch (error) {
      console.error('Notification permission failed:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't show if dismissed or not installable/updatable
  if (isDismissed || (!isInstallable && !hasUpdateAvailable && hasNotificationPermission)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="glass-morphism p-4 rounded-lg border border-white/20 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {hasUpdateAvailable ? (
                <RefreshCw className="w-5 h-5 text-blue-400" />
              ) : (
                <Download className="w-5 h-5 text-blue-400" />
              )}
              <h3 className="text-white font-semibold">
                {hasUpdateAvailable ? 'Update Available' : 'Install App'}
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {hasUpdateAvailable && (
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">
                  A new version is available with improvements and bug fixes.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {isUpdating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isUpdating ? 'Updating...' : 'Update Now'}
                </motion.button>
              </div>
            )}

            {isInstallable && !isInstalled && (
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">
                  Install Web AutoTest Pro for a better experience with offline support.
                </p>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    <span>Desktop App</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    <span>Mobile Ready</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isOnline ? (
                      <Wifi className="w-3 h-3 text-green-400" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-400" />
                    )}
                    <span>Offline Support</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    <span>Notifications</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {isInstalling ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isInstalling ? 'Installing...' : 'Install App'}
                </motion.button>
              </div>
            )}

            {!hasNotificationPermission && isInstalled && (
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">
                  Enable notifications to get alerts when tests complete.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNotificationPermission}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  Enable Notifications
                </motion.button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Web AutoTest Pro</span>
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-400" />
                )}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAPrompt;