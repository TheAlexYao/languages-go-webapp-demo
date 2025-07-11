import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MapPin, Check } from 'lucide-react';

type PermissionStep = 'intro' | 'location' | 'complete';

interface LoadingScreenProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
  isPWA?: boolean;
  onLocationRequest: () => Promise<any>;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  isPWA = false,
  onLocationRequest,
}) => {
  const [step, setStep] = useState<PermissionStep>('intro');
  const [isRequesting, setIsRequesting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);



  const requestLocationPermission = async () => {
    setIsRequesting(true);
    try {
      await onLocationRequest();
    } catch (error) {
      // The hook already handles errors and sets a default, so we can just log here
      console.warn('Location request hook finished with an error state, continuing flow.', error);
    } finally {
      setStep('complete');
      setIsRequesting(false);
    }
  };

  useEffect(() => {
    if (step === 'complete') {
      gsap.to(containerRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        ease: "power2.in",
        onComplete: onPermissionGranted
      });
    }
  }, [step, onPermissionGranted]);

  const renderContent = () => {
    switch (step) {
      case 'location':
        return (
          <PermissionCard
            icon={<MapPin className="h-8 w-8" />}
            title="Enable Location (Optional)"
            description="Location helps you remember where you discovered words by pinning them on a map. You can skip this if you prefer."
            buttonText="Allow Location"
            onAction={requestLocationPermission}
            isRequesting={isRequesting}
            showSkip
            onSkip={() => setStep('complete')}
          />
        );
      case 'intro':
      default:
        return (
          <PermissionCard
            icon={<img src="/icons/map-kun.svg" alt="Languages Go" className="h-10 w-10" />}
            title="Welcome to Languages Go!"
            description="Learn vocabulary in 8 different languages by taking photos of the world around you."
            buttonText="Get Started"
            onAction={() => setStep('location')}
          />
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    >
      {renderContent()}
    </div>
  );
};

// Helper component for the card UI
interface PermissionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onAction: () => void;
  isRequesting?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}

const PermissionCard: React.FC<PermissionCardProps> = ({
  icon, title, description, buttonText, onAction, isRequesting, showSkip, onSkip
}) => (
  <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
      {icon}
    </div>
    <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
    <p className="text-gray-400 text-sm mb-8">{description}</p>
    <div className="space-y-3">
      <button
        onClick={onAction}
        disabled={isRequesting}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {isRequesting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Check />}
        <span>{buttonText}</span>
      </button>
      {showSkip && (
        <button
          onClick={onSkip}
          className="w-full text-gray-400 text-sm py-2 px-4 rounded-xl hover:bg-white/10 transition-colors"
        >
          Skip for Now
        </button>
      )}
    </div>
  </div>
);