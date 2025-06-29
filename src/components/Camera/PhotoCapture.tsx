import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, MapPin, Loader2, Crosshair, AlertCircle, RefreshCw } from 'lucide-react';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { findCardsFromPhoto } from '../../services/supabase';
import { VocabularyCard, PhotoPin } from '../../types/vocabulary';
import { Location } from '../../types/location';

interface PhotoCaptureProps {
  onCardsGenerated: (cards: VocabularyCard[], pin: PhotoPin) => void;
  isEnabled?: boolean;
  selectedLanguage?: string;
  location: Location | null;
  locationLoading: boolean;
  locationError: string | null;
  onRetryLocation: () => void;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onCardsGenerated,
  isEnabled = true,
  selectedLanguage = 'es',
  location,
  locationLoading,
  locationError,
  onRetryLocation
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const { isMobile } = useMobileDetection();

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || isProcessing || !isEnabled || !location) return;

    try {
      setIsProcessing(true);
      
      setProcessingStep('Capturing photo...');
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error('Failed to capture photo');

      setProcessingStep('Analyzing photo with AI...');
      const imageBase64 = imageSrc.split(',')[1];
      
      const { cards, pin } = await findCardsFromPhoto(
        imageBase64,
        { lat: location.lat, lng: location.lng },
        selectedLanguage
      );

      const enhancedPin: PhotoPin = { ...pin, hasCollectedAll: false };
      setProcessingStep('Complete!');
      onCardsGenerated(cards, enhancedPin);

    } catch (error) {
      console.error('Photo capture failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setProcessingStep(
        errorMessage.includes('No vocabulary matches') 
          ? 'No new words found, try another photo!' 
          : 'Error occurred, please try again'
      );
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
      }, 1500);
    }
  }, [webcamRef, isProcessing, isEnabled, selectedLanguage, location, onCardsGenerated]);
  
  const videoConstraints = {
    width: isMobile ? 1280 : 1920,
    height: isMobile ? 720 : 1080,
    facingMode: isMobile ? 'environment' : undefined
  };

  const canCapture = !!location && !locationLoading && !isProcessing;

  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden shadow-2xl border border-slate-700/50 ${isMobile ? 'rounded-2xl' : 'rounded-3xl'}`}>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="w-full h-full object-cover"
        mirrored={!isMobile}
      />
      
      {/* Location UI remains the same, but uses props now */}
      <div className="absolute top-4 left-4 right-4">
        {location && !locationLoading && (
          <div className="bg-black/60 backdrop-blur-xl text-white px-3 py-2 rounded-xl flex items-center space-x-2 border border-white/10 shadow-lg">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <p className="text-xs font-medium">GPS Locked</p>
          </div>
        )}
        {locationLoading && (
          <div className="bg-amber-500/90 backdrop-blur-xl text-black px-3 py-2 rounded-xl flex items-center space-x-2 border border-amber-400/50 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-xs font-medium">Getting GPS...</p>
          </div>
        )}
        {locationError && !locationLoading && (
          <div className={`bg-orange-500/80 backdrop-blur-xl text-white px-2 py-1 rounded-xl border border-orange-400/50 shadow-lg`}>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <p className="text-xs font-medium">Using default location</p>
              <button onClick={onRetryLocation} className="p-0.5 hover:bg-white/20 rounded">
                <RefreshCw className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Other UI elements (capture button, overlays etc.) remain largely the same */}
      <div className={`absolute ${isMobile ? 'bottom-6' : 'bottom-8'} left-1/2 transform -translate-x-1/2`}>
        <button
          onClick={capturePhoto}
          disabled={!canCapture}
          className={`relative ${isMobile ? 'w-20 h-20' : 'w-24 h-24'} rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-xl ${
            !canCapture ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'
          }`}
        >
          <Camera className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-white`} />
        </button>
      </div>
    </div>
  );
};