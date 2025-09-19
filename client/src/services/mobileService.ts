// Mobile Service for ASTRAL_NOTES
// Handles mobile responsiveness, touch gestures, and PWA features

interface ViewportConfig {
  width: number;
  height: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

interface TouchGesture {
  type: 'tap' | 'doubletap' | 'longpress' | 'swipe' | 'pinch' | 'rotate';
  startTime: number;
  endTime?: number;
  startPoint: { x: number; y: number };
  endPoint?: { x: number; y: number };
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  velocity?: number;
  scale?: number;
  rotation?: number;
}

interface MobilePreferences {
  hapticFeedback: boolean;
  gestureNavigation: boolean;
  autoHideUI: boolean;
  fullscreenMode: boolean;
  touchSensitivity: 'low' | 'medium' | 'high';
  swipeThreshold: number;
  doubleTapZoom: boolean;
  pinchToZoom: boolean;
}

interface PWAInstallPrompt {
  available: boolean;
  prompt: any;
  userChoice?: 'accepted' | 'dismissed';
}

export class MobileService {
  private static instance: MobileService;
  private viewport: ViewportConfig;
  private preferences: MobilePreferences;
  private touchStartTime: number = 0;
  private touchStartPoints: { x: number; y: number }[] = [];
  private isTracking: boolean = false;
  private gestureListeners: Map<string, Set<(gesture: TouchGesture) => void>> = new Map();
  private orientationListeners: Set<(orientation: string) => void> = new Set();
  private viewportListeners: Set<(viewport: ViewportConfig) => void> = new Set();
  private installPrompt: PWAInstallPrompt = { available: false, prompt: null };
  private wakeLock: any = null;
  private vibrationPattern: number[] = [10, 10, 10];

  private constructor() {
    this.viewport = this.getViewportConfig();
    this.preferences = this.getDefaultPreferences();
    this.initialize();
  }

  public static getInstance(): MobileService {
    if (!MobileService.instance) {
      MobileService.instance = new MobileService();
    }
    return MobileService.instance;
  }

  private initialize(): void {
    // Load preferences
    this.loadPreferences();

    // Set up viewport monitoring
    this.setupViewportMonitoring();

    // Set up touch event listeners
    this.setupTouchListeners();

    // Set up orientation change listeners
    this.setupOrientationListeners();

    // Set up PWA install prompt
    this.setupPWAInstallPrompt();

    // Set up visibility change listeners
    this.setupVisibilityListeners();

    // Apply mobile-specific styles
    this.applyMobileStyles();

    // Set up service worker
    this.setupServiceWorker();
  }

  private getViewportConfig(): ViewportConfig {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const orientation = width > height ? 'landscape' : 'portrait';
    
    let breakpoint: 'mobile' | 'tablet' | 'desktop';
    if (width < 768) {
      breakpoint = 'mobile';
    } else if (width <= 1024) {
      breakpoint = 'tablet';
    } else {
      breakpoint = 'desktop';
    }

    return {
      width,
      height,
      devicePixelRatio,
      orientation,
      breakpoint
    };
  }

  private getDefaultPreferences(): MobilePreferences {
    return {
      hapticFeedback: true,
      gestureNavigation: true,
      autoHideUI: false,
      fullscreenMode: false,
      touchSensitivity: 'medium',
      swipeThreshold: 50,
      doubleTapZoom: true,
      pinchToZoom: true
    };
  }

  private loadPreferences(): void {
    const saved = localStorage.getItem('astral-mobile-preferences');
    if (saved) {
      try {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load mobile preferences:', error);
      }
    }
  }

  private savePreferences(): void {
    localStorage.setItem('astral-mobile-preferences', JSON.stringify(this.preferences));
  }

  private setupViewportMonitoring(): void {
    const updateViewport = () => {
      const newViewport = this.getViewportConfig();
      const changed = JSON.stringify(newViewport) !== JSON.stringify(this.viewport);
      
      if (changed) {
        this.viewport = newViewport;
        this.notifyViewportListeners();
        this.applyBreakpointStyles();
      }
    };

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', () => {
      // Delay to ensure orientation change is complete
      setTimeout(updateViewport, 100);
    });

    // Initial check
    updateViewport();
  }

  private setupTouchListeners(): void {
    let touchTimeout: NodeJS.Timeout | null = null;

    const handleTouchStart = (event: TouchEvent) => {
      if (!this.preferences.gestureNavigation) return;

      this.isTracking = true;
      this.touchStartTime = Date.now();
      this.touchStartPoints = Array.from(event.touches).map(touch => ({
        x: touch.clientX,
        y: touch.clientY
      }));

      // Long press detection
      if (event.touches.length === 1) {
        touchTimeout = setTimeout(() => {
          this.handleGesture({
            type: 'longpress',
            startTime: this.touchStartTime,
            startPoint: this.touchStartPoints[0]
          });
        }, 500);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!this.isTracking || !this.preferences.gestureNavigation) return;

      // Cancel long press if moved
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }

      // Handle pinch/zoom
      if (event.touches.length === 2 && this.preferences.pinchToZoom) {
        event.preventDefault();
        this.handlePinchGesture(event);
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!this.isTracking || !this.preferences.gestureNavigation) return;

      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }

      const endTime = Date.now();
      const duration = endTime - this.touchStartTime;

      if (event.changedTouches.length === 1) {
        const endPoint = {
          x: event.changedTouches[0].clientX,
          y: event.changedTouches[0].clientY
        };

        const startPoint = this.touchStartPoints[0];
        const distance = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + 
          Math.pow(endPoint.y - startPoint.y, 2)
        );

        // Determine gesture type
        if (distance < 10 && duration < 300) {
          // Check for double tap
          const lastTap = this.getLastTapTime();
          if (lastTap && endTime - lastTap < 300) {
            this.handleGesture({
              type: 'doubletap',
              startTime: this.touchStartTime,
              endTime,
              startPoint,
              endPoint
            });
          } else {
            this.setLastTapTime(endTime);
            this.handleGesture({
              type: 'tap',
              startTime: this.touchStartTime,
              endTime,
              startPoint,
              endPoint
            });
          }
        } else if (distance > this.preferences.swipeThreshold) {
          // Swipe gesture
          const direction = this.getSwipeDirection(startPoint, endPoint);
          const velocity = distance / duration;
          
          this.handleGesture({
            type: 'swipe',
            startTime: this.touchStartTime,
            endTime,
            startPoint,
            endPoint,
            distance,
            direction,
            velocity
          });
        }
      }

      this.isTracking = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
  }

  private handlePinchGesture(event: TouchEvent): void {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    // You would track initial distance and calculate scale
    const scale = currentDistance / 100; // Simplified calculation

    this.handleGesture({
      type: 'pinch',
      startTime: this.touchStartTime,
      startPoint: this.touchStartPoints[0],
      scale
    });
  }

  private getSwipeDirection(start: { x: number; y: number }, end: { x: number; y: number }): 'up' | 'down' | 'left' | 'right' {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  private getLastTapTime(): number | null {
    const stored = sessionStorage.getItem('astral-last-tap');
    return stored ? parseInt(stored) : null;
  }

  private setLastTapTime(time: number): void {
    sessionStorage.setItem('astral-last-tap', time.toString());
  }

  private handleGesture(gesture: TouchGesture): void {
    // Haptic feedback
    if (this.preferences.hapticFeedback) {
      this.vibrate();
    }

    // Notify listeners
    const listeners = this.gestureListeners.get(gesture.type);
    if (listeners) {
      listeners.forEach(callback => callback(gesture));
    }

    // Built-in gesture handlers
    this.executeBuiltInGesture(gesture);
  }

  private executeBuiltInGesture(gesture: TouchGesture): void {
    switch (gesture.type) {
      case 'swipe':
        if (gesture.direction === 'right' && gesture.startPoint.x < 50) {
          // Swipe from left edge - open sidebar
          this.emitEvent('open-sidebar');
        } else if (gesture.direction === 'left' && gesture.startPoint.x > window.innerWidth - 50) {
          // Swipe from right edge - close sidebar
          this.emitEvent('close-sidebar');
        } else if (gesture.direction === 'down' && gesture.startPoint.y < 50) {
          // Swipe down from top - refresh
          this.emitEvent('pull-to-refresh');
        }
        break;

      case 'doubletap':
        if (this.preferences.doubleTapZoom) {
          this.emitEvent('zoom-toggle');
        }
        break;

      case 'pinch':
        if (this.preferences.pinchToZoom && gesture.scale) {
          this.emitEvent('zoom-change', { scale: gesture.scale });
        }
        break;
    }
  }

  private setupOrientationListeners(): void {
    const handleOrientationChange = () => {
      const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      this.orientationListeners.forEach(callback => callback(newOrientation));
      
      // Update viewport
      setTimeout(() => {
        this.viewport = this.getViewportConfig();
        this.notifyViewportListeners();
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
  }

  private setupPWAInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = {
        available: true,
        prompt: event
      };
      
      this.emitEvent('pwa-install-available');
    });

    window.addEventListener('appinstalled', () => {
      this.installPrompt.available = false;
      this.emitEvent('pwa-installed');
    });
  }

  private setupVisibilityListeners(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.emitEvent('app-resumed');
        this.requestWakeLock();
      } else {
        this.emitEvent('app-paused');
        this.releaseWakeLock();
      }
    });
  }

  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NEW_VERSION_AVAILABLE') {
          this.emitEvent('update-available');
        }
      });
    }
  }

  private applyMobileStyles(): void {
    const root = document.documentElement;
    
    if (this.isMobile()) {
      root.classList.add('mobile-device');
      
      // Prevent zoom on input focus
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        );
      }

      // Add touch-friendly styles
      root.style.setProperty('--touch-target-size', '44px');
      root.style.setProperty('--scroll-behavior', 'smooth');
      
      // Enable momentum scrolling on iOS
      root.style.setProperty('-webkit-overflow-scrolling', 'touch');
    }

    if (this.isTablet()) {
      root.classList.add('tablet-device');
    }
  }

  private applyBreakpointStyles(): void {
    const root = document.documentElement;
    
    // Remove existing breakpoint classes
    root.classList.remove('mobile-breakpoint', 'tablet-breakpoint', 'desktop-breakpoint');
    
    // Add current breakpoint class
    root.classList.add(`${this.viewport.breakpoint}-breakpoint`);
  }

  // Public API Methods
  public isMobile(): boolean {
    return this.viewport.breakpoint === 'mobile';
  }

  public isTablet(): boolean {
    return this.viewport.breakpoint === 'tablet';
  }

  public isDesktop(): boolean {
    return this.viewport.breakpoint === 'desktop';
  }

  public getViewport(): ViewportConfig {
    return { ...this.viewport };
  }

  public getPreferences(): MobilePreferences {
    return { ...this.preferences };
  }

  public updatePreferences(prefs: Partial<MobilePreferences>): void {
    this.preferences = { ...this.preferences, ...prefs };
    this.savePreferences();
  }

  public vibrate(pattern?: number[]): void {
    if ('vibrate' in navigator && this.preferences.hapticFeedback) {
      navigator.vibrate(pattern || this.vibrationPattern);
    }
  }

  public async requestWakeLock(): Promise<void> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (error) {
        console.error('Wake lock request failed:', error);
      }
    }
  }

  public releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  public async installPWA(): Promise<boolean> {
    if (!this.installPrompt.available || !this.installPrompt.prompt) {
      return false;
    }

    try {
      this.installPrompt.prompt.prompt();
      const result = await this.installPrompt.prompt.userChoice;
      this.installPrompt.userChoice = result.outcome;
      
      if (result.outcome === 'accepted') {
        this.installPrompt.available = false;
        return true;
      }
    } catch (error) {
      console.error('PWA install failed:', error);
    }

    return false;
  }

  public isPWAInstallable(): boolean {
    return this.installPrompt.available;
  }

  public isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  public enterFullscreen(): void {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }

  public exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  public isFullscreen(): boolean {
    return Boolean(document.fullscreenElement);
  }

  // Gesture Event Listeners
  public onGesture(type: TouchGesture['type'], callback: (gesture: TouchGesture) => void): () => void {
    if (!this.gestureListeners.has(type)) {
      this.gestureListeners.set(type, new Set());
    }
    
    this.gestureListeners.get(type)!.add(callback);
    
    return () => {
      this.gestureListeners.get(type)?.delete(callback);
    };
  }

  public onOrientationChange(callback: (orientation: string) => void): () => void {
    this.orientationListeners.add(callback);
    return () => this.orientationListeners.delete(callback);
  }

  public onViewportChange(callback: (viewport: ViewportConfig) => void): () => void {
    this.viewportListeners.add(callback);
    return () => this.viewportListeners.delete(callback);
  }

  private notifyViewportListeners(): void {
    this.viewportListeners.forEach(callback => callback(this.viewport));
  }

  // Utility Methods
  public getDeviceInfo(): {
    userAgent: string;
    platform: string;
    touchSupport: boolean;
    standalone: boolean;
    pixelRatio: number;
    connection?: any;
  } {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      touchSupport: 'ontouchstart' in window,
      standalone: this.isPWAInstalled(),
      pixelRatio: window.devicePixelRatio,
      connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    };
  }

  public optimizeForMobile(): void {
    // Disable text selection on mobile
    if (this.isMobile()) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    }

    // Optimize scrolling
    document.body.style.overscrollBehavior = 'none';
    
    // Prevent rubber band effect
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const target = e.target as HTMLElement;
        if (!target.closest('.scrollable')) {
          e.preventDefault();
        }
      }
    }, { passive: false });
  }

  public getNetworkInfo(): {
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  } {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    };
  }

  public adaptToConnection(): void {
    const networkInfo = this.getNetworkInfo();
    
    if (networkInfo.saveData || networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      // Enable data saving mode
      this.emitEvent('enable-data-saving');
    }
  }

  // Share API
  public async share(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await (navigator as any).share(data);
        return true;
      } catch (error) {
        console.error('Web Share failed:', error);
      }
    }
    return false;
  }

  // Battery API
  public async getBatteryInfo(): Promise<{
    charging: boolean;
    level: number;
    chargingTime: number;
    dischargingTime: number;
  } | null> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          charging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (error) {
        console.error('Battery API failed:', error);
      }
    }
    return null;
  }

  private emitEvent(type: string, detail?: any): void {
    window.dispatchEvent(new CustomEvent(`astral-mobile-${type}`, { detail }));
  }

  // Cleanup
  public destroy(): void {
    this.gestureListeners.clear();
    this.orientationListeners.clear();
    this.viewportListeners.clear();
    this.releaseWakeLock();
  }
}

export default MobileService.getInstance();