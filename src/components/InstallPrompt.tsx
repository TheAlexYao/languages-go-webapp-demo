import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { pwaManager } from '../utils/pwa';

interface InstallPromptProps {
  onClose?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onClose }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleInstallAvailable = (available: boolean) => {
      setCanInstall(available);
      if (available && !pwaManager.isAppInstalled()) {
        // Show prompt after a delay to not be intrusive
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    pwaManager.onInstallAvailable(handleInstallAvailable);

    return () => {
      pwaManager.removeInstallCallback(handleInstallAvailable);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const installed = await pwaManager.promptInstall();
      if (installed) {
        setShowPrompt(false);
        onClose?.();
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    onClose?.();
  };

  if (!canInstall || !showPrompt || pwaManager.isAppInstalled()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-gradient-to-br from-blue-600/95 to-purple-600/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <img 
                src="/icons/map-kun.svg" 
                alt="Languages Go! Logo" 
                className="h-8 w-8" 
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white mb-1">
              Install Languages Go!
            </h3>
            <p className="text-xs text-white/80 mb-3 leading-relaxed">
              Catch vocab in the wild! Add to your home screen for quick access and offline use.
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 border border-white/30 backdrop-blur-sm"
              >
                {isInstalling ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Installing...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Install</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleClose}
                className="text-white/70 hover:text-white p-2 rounded-xl transition-colors duration-200 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};