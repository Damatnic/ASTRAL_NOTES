import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface PWAInstallPrompt {
  show: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWACapabilities {
  isStandalone: boolean;
  canInstall: boolean;
  isInstalled: boolean;
  supportsNotifications: boolean;
  supportsBackgroundSync: boolean;
  supportsOffline: boolean;
  hasServiceWorker: boolean;
  displayMode: 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen';
}

export interface PWAUpdateInfo {
  available: boolean;
  waiting: ServiceWorker | null;
  skipWaiting: () => Promise<void>;
}

export class PWAService extends BrowserEventEmitter {
  private installPrompt: PWAInstallPrompt | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable: boolean = false;
  private waitingWorker: ServiceWorker | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Register service worker
    await this.registerServiceWorker();
    
    // Setup install prompt listener
    this.setupInstallPrompt();
    
    // Setup app state change listener
    this.setupAppStateListener();
    
    // Check for updates periodically
    this.setupUpdateChecker();
    
    // Setup notification permission
    this.setupNotifications();

    this.emit('initialized', this.getCapabilities());
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Workers not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('[PWA] Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.updateAvailable = true;
            this.waitingWorker = newWorker;
            this.emit('updateAvailable', this.getUpdateInfo());
          }
        });
      });

      // Handle controller change (when new SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as any;
      this.emit('installAvailable');
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.emit('installed');
      this.trackAnalytics('pwa_installed');
    });
  }

  private setupAppStateListener(): void {
    // Detect if app is running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    if (isStandalone) {
      this.emit('runningStandalone');
      this.trackAnalytics('pwa_standalone_launch');
    }

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (event) => {
      if (event.matches) {
        this.emit('becameStandalone');
      } else {
        this.emit('leftStandalone');
      }
    });
  }

  private setupUpdateChecker(): void {
    // Check for updates every 30 minutes
    setInterval(() => {
      this.checkForUpdates();
    }, 30 * 60 * 1000);

    // Check for updates when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });
  }

  private setupNotifications(): void {
    if ('Notification' in window) {
      this.emit('notificationSupportAvailable');
    }
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'OFFLINE_READY':
        this.emit('offlineReady');
        break;
      case 'CACHE_UPDATED':
        this.emit('cacheUpdated', data.payload);
        break;
      case 'SYNC_COMPLETE':
        this.emit('syncComplete', data.payload);
        break;
      case 'BACKGROUND_SYNC':
        this.emit('backgroundSync', data.payload);
        break;
      default:
        console.log('[PWA] Unknown service worker message:', data);
    }
  }

  public async install(): Promise<boolean> {
    if (!this.installPrompt) {
      throw new Error('Installation not available');
    }

    try {
      const result = await this.installPrompt.show();
      const choice = await this.installPrompt.userChoice;
      
      this.trackAnalytics('pwa_install_prompt', {
        outcome: choice.outcome,
        platform: choice.platform
      });

      if (choice.outcome === 'accepted') {
        this.installPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Installation failed:', error);
      throw error;
    }
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    this.emit('notificationPermissionChanged', permission);
    this.trackAnalytics('notification_permission', { permission });
    
    return permission;
  }

  public async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    await this.registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      ...options
    });
  }

  public async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return this.updateAvailable;
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
      return false;
    }
  }

  public async applyUpdate(): Promise<void> {
    if (!this.waitingWorker) {
      throw new Error('No update available');
    }

    // Tell the waiting service worker to skip waiting
    this.waitingWorker.postMessage({ action: 'skipWaiting' });
    
    this.emit('updateApplying');
  }

  public async scheduleBackgroundSync(tag: string = 'project-sync'): Promise<void> {
    if (!this.registration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('[PWA] Background Sync not supported');
      return;
    }

    try {
      await this.registration.sync.register(tag);
      console.log('[PWA] Background sync scheduled:', tag);
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
    }
  }

  public getCapabilities(): PWACapabilities {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    return {
      isStandalone,
      canInstall: !!this.installPrompt,
      isInstalled: isStandalone,
      supportsNotifications: 'Notification' in window,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      supportsOffline: 'serviceWorker' in navigator,
      hasServiceWorker: !!this.registration,
      displayMode: this.getDisplayMode()
    };
  }

  public getUpdateInfo(): PWAUpdateInfo {
    return {
      available: this.updateAvailable,
      waiting: this.waitingWorker,
      skipWaiting: () => this.applyUpdate()
    };
  }

  private getDisplayMode(): 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' {
    if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
    if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
    return 'browser';
  }

  private trackAnalytics(event: string, data?: any): void {
    // Send analytics data
    this.emit('analytics', { event, data, timestamp: Date.now() });
  }

  public async shareContent(data: ShareData): Promise<boolean> {
    if (!('share' in navigator)) {
      // Fallback to clipboard
      if ('clipboard' in navigator) {
        const text = `${data.title || ''}\n${data.text || ''}\n${data.url || ''}`.trim();
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    }

    try {
      await (navigator as any).share(data);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('[PWA] Share failed:', error);
      }
      return false;
    }
  }

  public async addToHomeScreen(): Promise<boolean> {
    // For iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      this.emit('iosInstallInstructions');
      return false;
    }

    // For other browsers, try the install prompt
    return this.install();
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public setupOfflineHandling(): void {
    window.addEventListener('online', () => {
      this.emit('online');
      this.scheduleBackgroundSync();
    });

    window.addEventListener('offline', () => {
      this.emit('offline');
    });
  }

  public async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
      this.emit('cacheCleared');
    }
  }

  public async getCacheSize(): Promise<number> {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
      return 0;
    }

    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
}

export const pwaService = new PWAService();