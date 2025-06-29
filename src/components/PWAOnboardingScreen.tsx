import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  Download, 
  Smartphone, 
  Zap, 
  Camera, 
  MapPin, 
  Wifi, 
  Clock,
  Star,
  ArrowRight,
  X 
} from 'lucide-react';
import { pwaManager } from '../utils/pwa';

interface PWAOnboardingScreenProps {
  onInstall: () => void;
  onSkip: () => void;
  isMobile: boolean;
}

export const PWAOnboardingScreen: React.FC<PWAOnboardingScreenProps> = ({
  onInstall,
  onSkip,
  isMobile
}) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkInstallability = (available: boolean) => {
      setCanInstall(available);
    };

    pwaManager.onInstallAvailable(checkInstallability);
    
    return () => {
      pwaManager.removeInstallCallback(checkInstallability);
    };
  }, []);

  // Entrance animation
  useEffect(() => {
    if (!hasAnimated) {
      // Set initial states
      gsap.set([heroRef.current, benefitsRef.current, buttonsRef.current], {
        opacity: 0,
        y: 30
      });

      // Animate in sequence
      const tl = gsap.timeline({
        onComplete: () => setHasAnimated(true)
      });

      tl.to(heroRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      })
      .to(benefitsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out"
      }, "-=0.4")
      .to(buttonsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out"
      }, "-=0.3");
    }
  }, [hasAnimated]);

  const handleInstall = async () => {
    if (!canInstall) {
      // Show manual install instructions for browsers that don't support beforeinstallprompt
      onSkip();
      return;
    }

    setIsInstalling(true);
    
    try {
      const installed = await pwaManager.promptInstall();
      if (installed) {
        // Success animation
        if (containerRef.current) {
          gsap.to(containerRef.current, {
            scale: 1.05,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
            onComplete: () => {
              onInstall();
            }
          });
        } else {
          onInstall();
        }
      } else {
        setIsInstalling(false);
      }
    } catch (error) {
      console.error('PWA install failed:', error);
      setIsInstalling(false);
    }
  };

  const handleSkip = () => {
    // Slide out animation
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.4,
        ease: "power2.in",
        onComplete: onSkip
      });
    } else {
      onSkip();
    }
  };

  const benefits = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Instant Access",
      description: "Launch directly from your home screen—no browser needed"
    },
    {
      icon: <Camera className="h-5 w-5" />,
      title: "Quick Capture",
      description: "Faster camera startup for catching vocabulary on the go"
    },
    {
      icon: <Wifi className="h-5 w-5" />,
      title: "Works Offline",
      description: "Collect words even without an internet connection"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Always Ready",
      description: "No loading time—your vocab collection is always available"
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/30 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-gradient-to-l from-purple-500/25 to-indigo-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 w-full ${isMobile ? 'max-w-sm' : 'max-w-lg'} text-center`}>
        
        {/* Hero Section */}
        <div ref={heroRef} className="mb-8">
          <div className={`${isMobile ? 'w-20 h-20 mb-6' : 'w-24 h-24 mb-8'} mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl`}>
            <img 
              src="/icons/map-kun.svg" 
              alt="Languages Go Logo" 
              className={`${isMobile ? 'h-12 w-12' : 'h-14 w-14'} drop-shadow-lg`}
            />
          </div>
          
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent`}>
            Install Languages Go!
          </h1>
          
          <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-base'} leading-relaxed mb-6`}>
            Get the best experience by adding this app to your home screen. 
            It's like having a personal vocabulary trainer in your pocket!
          </p>

          {/* App Preview */}
          <div className={`${isMobile ? 'w-48 h-32' : 'w-64 h-40'} mx-auto bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-slate-600/50 flex items-center justify-center mb-6 shadow-xl`}>
            <div className="text-center">
              <Smartphone className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-blue-400 mx-auto mb-2`} />
              <p className={`text-white font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Tap & Collect</p>
              <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Vocabulary Cards</p>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div ref={benefitsRef} className={`grid ${isMobile ? 'grid-cols-1 gap-3 mb-8' : 'grid-cols-2 gap-4 mb-10'}`}>
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-left"
            >
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500/20 rounded-lg p-2 flex-shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className={`text-white font-semibold ${isMobile ? 'text-sm' : 'text-base'} mb-1`}>
                    {benefit.title}
                  </h3>
                  <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'} leading-tight`}>
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div ref={buttonsRef} className="space-y-3">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className={`
              w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
              disabled:from-gray-600 disabled:to-gray-700 text-white font-bold
              ${isMobile ? 'py-3 px-6 text-sm' : 'py-4 px-8 text-base'} rounded-2xl
              transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105
              disabled:transform-none disabled:cursor-not-allowed
              flex items-center justify-center space-x-3
            `}
          >
            {isInstalling ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Installing...</span>
              </>
            ) : canInstall ? (
              <>
                <Download className="h-5 w-5" />
                <span>Install App</span>
                <Star className="h-4 w-4 text-yellow-300" />
              </>
            ) : (
              <>
                <Smartphone className="h-5 w-5" />
                <span>Continue to App</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            disabled={isInstalling}
            className={`
              w-full text-gray-400 hover:text-white ${isMobile ? 'py-2 px-4 text-xs' : 'py-3 px-6 text-sm'}
              rounded-xl transition-colors duration-200 hover:bg-white/5
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center space-x-2
            `}
          >
            <span>Maybe Later</span>
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Installation Hint */}
        {!canInstall && (
          <div className="mt-4 text-center">
            <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {isMobile 
                ? "Tip: Use Safari's 'Add to Home Screen' for the best experience"
                : "Use your browser's install option or add to bookmarks for quick access"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 