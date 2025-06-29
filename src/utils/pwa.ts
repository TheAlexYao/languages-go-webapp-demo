// PWA utility functions

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private installCallbacks: Array<(canInstall: boolean) => void> = [];
  private readonly DISMISS_KEY = 'pwa-install-dismissed';
  private readonly DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  constructor() {
    this.init();
  }

  private init() {
    // Check if app is already installed
    this.checkInstallStatus();

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyInstallCallbacks(true);
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed');
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.clearDismissal(); // Clear dismissal when app is installed
      this.notifyInstallCallbacks(false);
    });

    // Register service worker
    this.registerServiceWorker();
  }

  private checkInstallStatus() {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('PWA: App is running in standalone mode');
    }

    // Check for iOS Safari standalone mode
    if ((window.navigator as any).standalone === true) {
      this.isInstalled = true;
      console.log('PWA: App is running in iOS standalone mode');
    }
  }

  private async registerServiceWorker() {
    // Skip service worker registration if PWA is disabled
    if (import.meta.env.VITE_APP_DISABLE_PWA === 'true') {
      console.log('PWA: Service Worker registration disabled via environment variable');
      return;
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('PWA: Service Worker registered successfully', registration);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('PWA: New service worker available');
                // Optionally show update notification to user
                this.showUpdateNotification();
              }
            });
          }
        });

      } catch (error) {
        console.error('PWA: Service Worker registration failed', error);
      }
    } else {
      console.log('PWA: Service Worker not supported');
    }
  }

  private showUpdateNotification() {
    // You can implement a custom update notification here
    console.log('PWA: App update available');
  }

  private notifyInstallCallbacks(canInstall: boolean) {
    this.installCallbacks.forEach(callback => callback(canInstall));
  }

  private isDismissed(): boolean {
    try {
      const dismissedData = localStorage.getItem(this.DISMISS_KEY);
      if (!dismissedData) return false;

      const { timestamp } = JSON.parse(dismissedData);
      const now = Date.now();
      
      // Check if dismissal has expired
      if (now - timestamp > this.DISMISS_DURATION) {
        this.clearDismissal();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('PWA: Error checking dismissal status', error);
      return false;
    }
  }

  private setDismissed() {
    try {
      const dismissData = {
        timestamp: Date.now()
      };
      localStorage.setItem(this.DISMISS_KEY, JSON.stringify(dismissData));
      console.log('PWA: Install prompt dismissed for 7 days');
    } catch (error) {
      console.error('PWA: Error setting dismissal', error);
    }
  }

  private clearDismissal() {
    try {
      localStorage.removeItem(this.DISMISS_KEY);
      console.log('PWA: Install prompt dismissal cleared');
    } catch (error) {
      console.error('PWA: Error clearing dismissal', error);
    }
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA: No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      console.log('PWA: User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        this.deferredPrompt = null;
        this.clearDismissal(); // Clear dismissal on successful install
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA: Error showing install prompt', error);
      return false;
    }
  }

  public canInstall(): boolean {
    return !this.isInstalled && this.deferredPrompt !== null && !this.isDismissed();
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public dismissInstallPrompt() {
    this.setDismissed();
    this.notifyInstallCallbacks(false);
  }

  public onInstallAvailable(callback: (canInstall: boolean) => void) {
    this.installCallbacks.push(callback);
    
    // Immediately call with current state
    callback(this.canInstall());
  }

  public removeInstallCallback(callback: (canInstall: boolean) => void) {
    const index = this.installCallbacks.indexOf(callback);
    if (index > -1) {
      this.installCallbacks.splice(index, 1);
    }
  }

  public async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log('PWA: Persistent storage:', persistent);
        return persistent;
      } catch (error) {
        console.error('PWA: Error requesting persistent storage', error);
        return false;
      }
    }
    return false;
  }

  public async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        console.log('PWA: Storage estimate:', estimate);
        return estimate;
      } catch (error) {
        console.error('PWA: Error getting storage estimate', error);
        return null;
      }
    }
    return null;
  }

  public shouldShowOnboarding(): boolean {
    // Show onboarding if:
    // 1. Not already installed
    // 2. Can potentially install (has beforeinstallprompt or is supported browser)
    // 3. Hasn't been dismissed recently
    return !this.isInstalled && !this.isDismissed() && (this.deferredPrompt !== null || this.canPotentiallyInstall());
  }

  private canPotentiallyInstall(): boolean {
    // Check if browser supports PWA installation
    // This includes Safari on iOS (manual install) and other browsers
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);
    const isEdge = /edge/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);
    
    // Most modern browsers support PWA in some form
    return isIOS || isSafari || isChrome || isEdge || isFirefox;
  }

  public skipOnboarding() {
    // Mark as if dismissed to prevent showing again soon
    this.setDismissed();
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();