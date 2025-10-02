// PWA Service for managing service worker, installation, and offline capabilities

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  isOfflineCapable: boolean;
  hasNotificationPermission: boolean;
  supportsPush: boolean;
  supportsBackgroundSync: boolean;
}

export class PWAService {
  private installPrompt: InstallPromptEvent | null = null;
  private isInstalled = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private callbacks: Map<string, Function[]> = new Map();

  constructor() {
    this.init();
  }

  private async init() {
    // Check if already installed
    this.isInstalled = this.checkIfInstalled();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.installPrompt = e as InstallPromptEvent;
      this.emit('installable', true);
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.installPrompt = null;
      this.emit('installed', true);
    });

    // Register service worker
    await this.registerServiceWorker();

    // Setup notification permissions
    this.checkNotificationPermission();

    // Setup periodic background sync
    this.setupBackgroundSync();
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        this.serviceWorkerRegistration = registration;

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true;
                this.emit('updateAvailable', true);
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

        console.log('[PWA] Service worker registered successfully');
        this.emit('serviceWorkerReady', registration);

      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
        this.emit('serviceWorkerError', error);
      }
    }
  }

  private handleServiceWorkerMessage(data: any) {
    switch (data.type) {
      case 'test-data-synced':
        this.emit('testDataSynced', data.data);
        break;
      case 'execution-results-synced':
        this.emit('executionResultsSynced', data.data);
        break;
      default:
        console.log('[PWA] Unknown service worker message:', data);
    }
  }

  // App Installation
  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      throw new Error('App installation not available');
    }

    try {
      await this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        this.installPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      throw error;
    }
  }

  isInstallPromptAvailable(): boolean {
    return this.installPrompt !== null;
  }

  private checkIfInstalled(): boolean {
    // Check if app is running as PWA
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Service Worker Updates
  async applyUpdate(): Promise<void> {
    if (!this.updateAvailable || !this.serviceWorkerRegistration) {
      throw new Error('No update available');
    }

    const newWorker = this.serviceWorkerRegistration.waiting;
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  hasUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  // Offline Capabilities
  async cacheTestData(data: any): Promise<void> {
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'CACHE_TEST_DATA',
        data
      });
    }
  }

  async requestSync(tag: string = 'test-data-sync'): Promise<void> {
    if (this.serviceWorkerRegistration && 'sync' in this.serviceWorkerRegistration) {
      try {
        await (this.serviceWorkerRegistration as any).sync.register(tag);
        console.log('[PWA] Background sync registered:', tag);
      } catch (error) {
        console.error('[PWA] Background sync registration failed:', error);
      }
    }
  }

  // Push Notifications
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    this.emit('notificationPermissionChanged', permission);
    return permission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    const permission = await this.requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey()) as BufferSource
      });

      console.log('[PWA] Push subscription created:', subscription);
      this.emit('pushSubscribed', subscription);
      return subscription;

    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      throw error;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        const result = await subscription.unsubscribe();
        if (result) {
          this.emit('pushUnsubscribed', true);
        }
        return result;
      }
      return true;
    } catch (error) {
      console.error('[PWA] Push unsubscribe failed:', error);
      return false;
    }
  }

  async showLocalNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (Notification.permission !== 'granted') {
      await this.requestNotificationPermission();
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      });
    }
  }

  // PWA Capabilities Detection
  getCapabilities(): PWACapabilities {
    return {
      isInstallable: this.installPrompt !== null,
      isInstalled: this.isInstalled,
      isOfflineCapable: 'serviceWorker' in navigator,
      hasNotificationPermission: Notification.permission === 'granted',
      supportsPush: 'PushManager' in window,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }

  // Network Status
  isOnline(): boolean {
    return navigator.onLine;
  }

  private checkNotificationPermission() {
    if ('Notification' in window) {
      this.emit('notificationPermissionChanged', Notification.permission);
    }
  }

  private setupBackgroundSync() {
    // Setup periodic sync for test data
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Background sync is supported
      console.log('[PWA] Background sync is supported');
    }
  }

  private getVapidPublicKey(): string {
    // In a real implementation, this would come from your server configuration
    // This is a placeholder key - replace with your actual VAPID public key
    return 'BF8Q9ETOAQ_UT7gA5YfBzUSFOJpv9xSTqKGJp_gBKpTJqrFLlJw8f1n2kFnpYkQ9F8Vl8YfBzUSFOJpv9xSTqKGJp';
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Event System
  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Cleanup
  destroy() {
    this.callbacks.clear();
  }
}

// Singleton instance
let pwaService: PWAService | null = null;

export const getPWAService = (): PWAService => {
  if (!pwaService) {
    pwaService = new PWAService();
  }
  return pwaService;
};

export default PWAService;