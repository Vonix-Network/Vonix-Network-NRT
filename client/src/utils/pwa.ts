import React from 'react';
import { isStandalone, supportsPWA } from './deviceDetection';

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAManager {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private callbacks: {
    onInstallPromptAvailable?: (prompt: PWAInstallPrompt) => void;
    onInstalled?: () => void;
    onUpdateAvailable?: () => void;
  } = {};

  constructor() {
    this.init();
  }

  private init() {
    // Check if already installed
    this.isInstalled = isStandalone();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as any;
      if (this.deferredPrompt) {
        this.callbacks.onInstallPromptAvailable?.(this.deferredPrompt);
      }
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.callbacks.onInstalled?.();
    });

    // Register service worker
    this.registerServiceWorker();
  }

  private async registerServiceWorker() {
    if (!supportsPWA()) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.callbacks.onUpdateAvailable?.();
            }
          });
        }
      });

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) return false;

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  public canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public onInstallPromptAvailable(callback: (prompt: PWAInstallPrompt) => void) {
    this.callbacks.onInstallPromptAvailable = callback;
  }

  public onInstalled(callback: () => void) {
    this.callbacks.onInstalled = callback;
  }

  public onUpdateAvailable(callback: () => void) {
    this.callbacks.onUpdateAvailable = callback;
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!supportsPWA()) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // Replace with your VAPID public key
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f4EmgHqKkDXcpULtjplaYF_ZYM2Xqq1xsNiNzGFhTMg3ByZVbrw'
        )
      });

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
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

  public async updateApp(): Promise<void> {
    if (!supportsPWA()) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('App update failed:', error);
    }
  }
}

export const pwaManager = new PWAManager();

// React hook for PWA functionality
export const usePWA = () => {
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  React.useEffect(() => {
    setIsInstalled(pwaManager.isAppInstalled());
    setCanInstall(pwaManager.canInstall());

    pwaManager.onInstallPromptAvailable(() => {
      setCanInstall(true);
    });

    pwaManager.onInstalled(() => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    pwaManager.onUpdateAvailable(() => {
      setUpdateAvailable(true);
    });
  }, []);

  const install = async () => {
    const success = await pwaManager.showInstallPrompt();
    if (success) {
      setCanInstall(false);
    }
    return success;
  };

  const update = async () => {
    await pwaManager.updateApp();
    setUpdateAvailable(false);
  };

  return {
    canInstall,
    isInstalled,
    updateAvailable,
    install,
    update,
    requestNotifications: pwaManager.requestNotificationPermission.bind(pwaManager),
    subscribeToPush: pwaManager.subscribeToPushNotifications.bind(pwaManager)
  };
};
