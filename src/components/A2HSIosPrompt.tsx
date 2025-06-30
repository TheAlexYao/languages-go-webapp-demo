import React, { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';

const A2HS_DISMISS_KEY = 'a2hs-ios-prompt-dismissed';

// Detect iOS
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Detect if running as PWA
const isPWA = () => window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone === true;

export const A2HSIosPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(A2HS_DISMISS_KEY);
    if (isIOS() && !isPWA() && !dismissed) {
      // Show the prompt after a short delay to not overwhelm the user
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(A2HS_DISMISS_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-4 shadow-2xl text-white transition-all duration-500 ease-in-out">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/70 hover:text-white"
        aria-label="Dismiss"
      >
        <X size={20} />
      </button>
      <div className="flex items-center">
        <img src="/apple-touch-icon-180x180.png" alt="App Icon" className="w-12 h-12 rounded-lg mr-4" />
        <div>
          <h3 className="font-bold text-base">Install the App</h3>
          <p className="text-sm text-white/90">
            Tap the <Share className="inline-block h-4 w-4 mx-1" /> icon and then 'Add to Home Screen'.
          </p>
        </div>
      </div>
    </div>
  );
};
