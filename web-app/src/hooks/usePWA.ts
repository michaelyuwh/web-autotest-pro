import { useState, useEffect } from 'react';
import { getPWAService, PWAService } from '../services/pwaService';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOfflineCapable: boolean;
  hasNotificationPermission: boolean;
  supportsPush: boolean;
  supportsBackgroundSync: boolean;
  isOnline: boolean;
  hasUpdateAvailable: boolean;
  isServiceWorkerReady: boolean;
}

interface PWAHookReturn extends PWAState {
  installApp: () => Promise<boolean>;
  applyUpdate: () => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  subscribeToPush: () => Promise<PushSubscription | null>;
  unsubscribeFromPush: () => Promise<boolean>;
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>;
  cacheTestData: (data: any) => Promise<void>;
  requestSync: (tag?: string) => Promise<void>;
}

export const usePWA = (): PWAHookReturn => {
  const [pwaService] = useState<PWAService>(() => getPWAService());
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOfflineCapable: false,
    hasNotificationPermission: false,
    supportsPush: false,
    supportsBackgroundSync: false,
    isOnline: navigator.onLine,
    hasUpdateAvailable: false,
    isServiceWorkerReady: false
  });

  useEffect(() => {
    // Initialize state with current capabilities
    const capabilities = pwaService.getCapabilities();
    setState(prev => ({
      ...prev,
      ...capabilities,
      isOnline: pwaService.isOnline(),
      hasUpdateAvailable: pwaService.hasUpdateAvailable()
    }));

    // Setup event listeners
    const handleInstallable = (isInstallable: boolean) => {
      setState(prev => ({ ...prev, isInstallable }));
    };

    const handleInstalled = (isInstalled: boolean) => {
      setState(prev => ({ ...prev, isInstalled, isInstallable: false }));
    };

    const handleUpdateAvailable = (hasUpdateAvailable: boolean) => {
      setState(prev => ({ ...prev, hasUpdateAvailable }));
    };

    const handleServiceWorkerReady = () => {
      setState(prev => ({ ...prev, isServiceWorkerReady: true }));
    };

    const handleNotificationPermissionChanged = (permission: NotificationPermission) => {
      setState(prev => ({ 
        ...prev, 
        hasNotificationPermission: permission === 'granted' 
      }));
    };

    const handleOnlineStatusChange = () => {
      setState(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    // PWA service events
    pwaService.on('installable', handleInstallable);
    pwaService.on('installed', handleInstalled);
    pwaService.on('updateAvailable', handleUpdateAvailable);
    pwaService.on('serviceWorkerReady', handleServiceWorkerReady);
    pwaService.on('notificationPermissionChanged', handleNotificationPermissionChanged);

    // Browser events
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      pwaService.off('installable', handleInstallable);
      pwaService.off('installed', handleInstalled);
      pwaService.off('updateAvailable', handleUpdateAvailable);
      pwaService.off('serviceWorkerReady', handleServiceWorkerReady);
      pwaService.off('notificationPermissionChanged', handleNotificationPermissionChanged);
      
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [pwaService]);

  const installApp = async (): Promise<boolean> => {
    try {
      return await pwaService.promptInstall();
    } catch (error) {
      console.error('Failed to install app:', error);
      throw error;
    }
  };

  const applyUpdate = async (): Promise<void> => {
    try {
      await pwaService.applyUpdate();
    } catch (error) {
      console.error('Failed to apply update:', error);
      throw error;
    }
  };

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    try {
      const permission = await pwaService.requestNotificationPermission();
      setState(prev => ({ 
        ...prev, 
        hasNotificationPermission: permission === 'granted' 
      }));
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw error;
    }
  };

  const subscribeToPush = async (): Promise<PushSubscription | null> => {
    try {
      return await pwaService.subscribeToPushNotifications();
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
      return await pwaService.unsubscribeFromPushNotifications();
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
    try {
      await pwaService.showLocalNotification(title, options);
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw error;
    }
  };

  const cacheTestData = async (data: any): Promise<void> => {
    try {
      await pwaService.cacheTestData(data);
    } catch (error) {
      console.error('Failed to cache test data:', error);
      throw error;
    }
  };

  const requestSync = async (tag?: string): Promise<void> => {
    try {
      await pwaService.requestSync(tag);
    } catch (error) {
      console.error('Failed to request sync:', error);
      throw error;
    }
  };

  return {
    ...state,
    installApp,
    applyUpdate,
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
    showNotification,
    cacheTestData,
    requestSync
  };
};

export default usePWA;