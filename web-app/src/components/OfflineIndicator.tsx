import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const { isOnline, isServiceWorkerReady } = usePWA();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-0 left-0 right-0 z-50 ${className}`}
        >
          <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">
                You're offline. Some features may be limited.
              </span>
              <button
                onClick={handleRetry}
                className="ml-2 px-2 py-1 bg-yellow-600 text-yellow-100 rounded text-xs hover:bg-yellow-700 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          </div>
        </motion.div>
      )}
      
      {isOnline && !isServiceWorkerReady && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-0 left-0 right-0 z-50 ${className}`}
        >
          <div className="bg-blue-500 text-blue-100 px-4 py-2 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Loading offline capabilities...
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Status indicator for the header/navbar
export const ConnectionStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline, isServiceWorkerReady } = usePWA();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
        <span className="text-xs text-gray-400">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      
      {isOnline && !isServiceWorkerReady && (
        <div className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
          <span className="text-xs text-blue-400">Loading...</span>
        </div>
      )}
      
      {isOnline && isServiceWorkerReady && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-xs text-green-400">Ready</span>
        </div>
      )}
    </div>
  );
};

// Offline notice for specific features
export const OfflineNotice: React.FC<{ 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { isOnline } = usePWA();

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <WifiOff className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Feature Unavailable Offline
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          This feature requires an internet connection to work properly.
        </p>
        {fallback || (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Check Connection
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

// Data sync status indicator
export const SyncStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline } = usePWA();
  const [lastSync, setLastSync] = React.useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    // Simulate sync status updates
    const interval = setInterval(() => {
      if (isOnline) {
        setLastSync(new Date());
      }
    }, 30000); // Update every 30 seconds when online

    return () => clearInterval(interval);
  }, [isOnline]);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className={`text-xs text-gray-400 ${className}`}>
      <div className="flex items-center gap-1">
        {isSyncing ? (
          <>
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Syncing...</span>
          </>
        ) : isOnline ? (
          <>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Synced {formatLastSync(lastSync)}</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3 text-yellow-400" />
            <span>Offline - changes saved locally</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;