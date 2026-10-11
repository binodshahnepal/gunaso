'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / standalone
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    // 2. Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('BPKMCH Service Worker registered successfully:', reg.scope);
          })
          .catch((err) => {
            console.warn('BPKMCH Service Worker registration failed:', err);
          });
      });
    }

    // 3. Listen for Install Prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user has previously dismissed within 3 days
      const dismissed = localStorage.getItem('bpkmch_pwa_dismissed');
      if (!dismissed || Date.now() - Number(dismissed) > 3 * 24 * 60 * 60 * 1000) {
        setShowInstallBanner(true);
      }
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
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('bpkmch_pwa_dismissed', Date.now().toString());
  };

  if (!showInstallBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#1a385c] text-white p-4 rounded-2xl shadow-2xl border border-blue-400/40 flex items-center justify-between gap-3.5 animate-in slide-in-from-bottom duration-300">
      <div className="w-12 h-12 bg-white rounded-xl p-0.5 shadow-md shrink-0 flex items-center justify-center">
        <img
          src="/bkmch-logo.png"
          alt="BPKMCH App Icon"
          className="w-full h-full object-contain rounded-xl"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Install BPKMCH Gunaso App</span>
        </div>
        <p className="text-[11px] text-blue-200 mt-0.5 line-clamp-1">
          मोबाइलमा एप इन्स्टल गरी छिटो उजुरी तथा स्थिति हेर्नुहोस्।
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-blue-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
