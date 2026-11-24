'use client';

import { useState, useEffect } from 'react';
import { Download, Bell, BellCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Check Notification status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsAllowed(Notification.permission === 'granted');
    }

    // Capture install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      toast.success('Buddio installed to your home screen!');
    }
    setDeferredPrompt(null);
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported on this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsAllowed(true);
        toast.success('Push notifications enabled for tasks & reminders!');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('Buddio Notifications Active', {
              body: 'You will receive reminders and scheduled alerts right here.',
              icon: '/buddio-icon.png',
            });
          });
        }
      } else {
        toast.error('Notification permission was denied.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (dismissed) return null;

  // Show banner if installable or if notifications not yet enabled on mobile/desktop
  const showBanner = isInstallable || (!notificationsAllowed && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'denied');

  if (!showBanner) return null;

  return (
    <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-purple-950/30 to-black/40 p-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
          {isInstallable ? <Download size={20} /> : <Bell size={20} />}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {isInstallable ? 'Install Buddio App' : 'Enable Live Task Alerts'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {isInstallable
              ? 'Install to your mobile home screen for full-screen mode & instant access.'
              : 'Receive instant push reminders for scheduled deadlines & meetings.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isInstallable && (
          <Button size="sm" onClick={handleInstallClick} className="gap-1.5 text-xs h-8">
            <Download size={14} /> Install App
          </Button>
        )}

        {!notificationsAllowed && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleEnableNotifications}
            className="gap-1.5 text-xs h-8 border-sky-500/40 text-sky-300 hover:bg-sky-500/20"
          >
            <Bell size={14} /> Enable Alerts
          </Button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground transition"
          aria-label="Dismiss banner"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
