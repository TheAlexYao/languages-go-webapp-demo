import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, MapPin, Loader2, Crosshair, AlertCircle, RefreshCw } from 'lucide-react';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useGeolocation } from '../../hooks/useGeolocation';
import { findCardsFromPhoto } from '../../services/supabase';
import { VocabularyCard, PhotoPin } from '../../types/vocabulary';

interface PhotoCaptureProps {
  onCardsGenerated: (cards: VocabularyCard[], pin: PhotoPin) => void;
  isEnabled?: boolean;
  selectedLanguage?: string;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onCardsGenerated,
  isEnabled = true,
  selectedLanguage = 'es'
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const { isMobile } = useMobileDetection();
  const { getCurrentLocation, location, accuracy, isLoading: locationLoading, error: locationError, retryLocation } = useGeolocation();

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || isProcessing || !isEnabled) return;

    try {
      setIsProcessing(true);
      
      // Step 1: Get location (with fallback)
      setProcessingStep('Getting location...');
      let currentLocation = location;
      
      if (!currentLocation) {
        try {
          currentLocation = await getCurrentLocation();
        } catch (error) {
          console.warn('Failed to get current location, using default:', error);
          // Use default location if geolocation fails
          currentLocation = { lat: 40.7128, lng: -74.0060, accuracy: 1000 };
        }
      }

      // Step 2: Capture photo
      setProcessingStep('Capturing photo...');
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error('Failed to capture photo');

      // Step 3: Analyze photo and find cards using Gemini API
      setProcessingStep('Analyzing photo with AI...');
      const imageBase64 = imageSrc.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      
      setProcessingStep('Identifying objects...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      setProcessingStep('Finding vocabulary matches...');
      const { cards, pin } = await findCardsFromPhoto(imageBase64, {
        lat: currentLocation.lat,
        lng: currentLocation.lng
      }, selectedLanguage); // Pass selected language

      // Add hasCollectedAll property to pin
      const enhancedPin: PhotoPin = {
        ...pin,
        hasCollectedAll: false
      };

      setProcessingStep('Complete!');
      onCardsGenerated(cards, enhancedPin);

    } catch (error) {
      console.error('Photo capture failed:', error);
      
      // Determine user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('User authentication required')) {
        setProcessingStep('Authentication required');
      } else if (errorMessage.includes('Photo analysis failed')) {
        setProcessingStep('Unable to analyze photo');
      } else if (errorMessage.includes('No vocabulary matches')) {
        setProcessingStep('No new words found, try another photo!');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setProcessingStep('Connection error, please try again');
      } else {
        setProcessingStep('Error occurred, please try again');
      }
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
      }, 1000);
    }
  }, [webcamRef, isProcessing, isEnabled, selectedLanguage, location, getCurrentLocation, onCardsGenerated]);

  const handleRetryLocation = useCallback(() => {
    retryLocation().catch(console.error);
  }, [retryLocation]);

  const videoConstraints = {
    width: isMobile ? 1280 : 1920,
    height: isMobile ? 720 : 1080,
    facingMode: isMobile ? 'environment' : undefined
  };

  const hasLocation = location && !locationLoading;
  const canCapture = hasLocation && !isProcessing;

  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden shadow-2xl border border-slate-700/50 ${
      isMobile ? 'rounded-2xl' : 'rounded-3xl'
    }`}>
      {/* Camera Feed */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="w-full h-full object-cover"
        mirrored={!isMobile}
      />

      {/* Gradient Overlay for Better UI Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />

      {/* Camera Viewfinder - Mobile Only */}
      {isMobile && !isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <Crosshair className="h-16 w-16 text-white/40" strokeWidth={1} />
            <div className="absolute inset-0 border-2 border-white/20 rounded-lg animate-pulse" style={{ width: '200px', height: '150px', top: '-75px', left: '-100px' }} />
          </div>
        </div>
      )}

      {/* Location Indicator */}
      {hasLocation && (
        <div className={`absolute ${isMobile ? 'top-4 left-4' : 'top-6 left-6'} bg-black/60 backdrop-blur-xl text-white px-3 py-2 rounded-xl flex items-center space-x-2 border border-white/10 shadow-lg`}>
          <div className="relative">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-medium">GPS Locked</p>
            {!isMobile && accuracy && (
              <p className="text-xs text-gray-300">±{Math.round(accuracy)}m</p>
            )}
          </div>
        </div>
      )}

      {/* Location Loading */}
      {locationLoading && (
        <div className={`absolute ${isMobile ? 'top-4 left-4' : 'top-6 left-6'} bg-amber-500/90 backdrop-blur-xl text-black px-3 py-2 rounded-xl flex items-center space-x-2 border border-amber-400/50 shadow-lg`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          <div>
            <p className="text-xs font-medium">Getting GPS...</p>
          </div>
        </div>
      )}

      {/* Location Error */}
      {locationError && !locationLoading && (
        <div className={`absolute ${isMobile ? 'top-4 left-4 right-4' : 'top-6 left-6'} ${isMobile ? 'bg-orange-500/80' : 'bg-orange-500/90'} backdrop-blur-xl text-white ${isMobile ? 'px-2 py-1' : 'px-3 py-2'} rounded-xl border border-orange-400/50 shadow-lg ${isMobile ? 'max-w-none' : 'max-w-xs'}`}>
          <div className="flex items-center space-x-2">
            <AlertCircle className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium`}>Using default location</p>
              {!isMobile && (
                <p className="text-xs opacity-90 leading-tight">{locationError}</p>
              )}
            </div>
            <button
              onClick={handleRetryLocation}
              className={`flex-shrink-0 ${isMobile ? 'p-0.5' : 'p-1'} hover:bg-white/20 rounded transition-colors`}
            >
              <RefreshCw className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
            </button>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-md flex items-center justify-center">
          <div className={`text-center text-white ${isMobile ? 'max-w-xs mx-auto px-4' : 'max-w-sm mx-auto px-6'}`}>
            <div className="relative mb-6">
              <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl`}>
                <Loader2 className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} animate-spin text-white`} />
              </div>
              <div className={`absolute inset-0 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-ping opacity-20`} />
            </div>
            
            <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent`}>
              Creating Magic
            </h3>
            <p className={`${isMobile ? 'text-base' : 'text-lg'} text-gray-300 mb-3`}>{processingStep}</p>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Capture Button */}
      <div className={`absolute ${isMobile ? 'bottom-6' : 'bottom-8'} left-1/2 transform -translate-x-1/2`}>
        <div className="relative">
          <button
            onClick={capturePhoto}
            disabled={!canCapture}
            className={`
              relative ${isMobile ? 'w-20 h-20' : 'w-24 h-24'} rounded-full border-4 flex items-center justify-center
              transition-all duration-300 shadow-2xl backdrop-blur-xl
              ${!canCapture
                ? 'opacity-50 cursor-not-allowed bg-gray-700/50 border-gray-500/30'
                : 'bg-white/10 border-white/30 hover:bg-white/20 hover:border-white/50 hover:scale-110 active:scale-95 cursor-pointer'
              }
            `}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <Camera className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-white drop-shadow-lg`} />
            
            {/* Pulse Ring */}
            {canCapture && (
              <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
            )}
          </button>
          
          {/* Capture Hint */}
          {canCapture && !isMobile && (
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <p className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                Tap to discover words
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Location Warning */}
      {!hasLocation && !locationLoading && !isProcessing && (
        <div className={`absolute ${isMobile ? 'bottom-28' : 'bottom-32'} left-1/2 transform -translate-x-1/2 bg-amber-500/90 backdrop-blur-sm text-black px-4 py-2 rounded-xl text-sm font-medium shadow-lg border border-amber-400/50 max-w-xs text-center`}>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-black/60 rounded-full animate-pulse" />
            <span>Getting your location...</span>
          </div>
        </div>
      )}

      {/* Instruction Overlay - Desktop Only */}
      {canCapture && !isMobile && (
        <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-xl text-white px-4 py-3 rounded-2xl border border-white/10 shadow-lg max-w-xs">
          <h4 className="font-semibold text-sm mb-1">How to Play</h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            Point your camera at objects around you and tap the capture button to discover new vocabulary words!
          </p>
        </div>
      )}

      {/* Mobile Instructions */}
      {canCapture && isMobile && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xl text-white px-3 py-2 rounded-xl border border-white/10 shadow-lg">
          <p className="text-xs text-gray-300 text-center">
            Point & Tap to Discover
          </p>
        </div>
      )}
    </div>
  );
};