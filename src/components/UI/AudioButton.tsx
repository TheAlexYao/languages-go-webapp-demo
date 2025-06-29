import React, { useState } from 'react';
import { Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
import { pronunciationManager, AudioState } from '../../utils/audio';

interface AudioButtonProps {
  text: string;
  language: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'minimal';
  showFlag?: boolean;
  showText?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  language,
  size = 'md',
  variant = 'primary',
  showFlag = true,
  showText = false,
  className = '',
  disabled = false,
  onClick
}) => {
  const [audioState, setAudioState] = useState<AudioState>('idle');

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);

    if (disabled || audioState === 'playing' || audioState === 'loading') {
      return;
    }

    if (!pronunciationManager.checkSupport()) {
      setAudioState('error');
      setTimeout(() => setAudioState('idle'), 2000);
      return;
    }

    try {
      await pronunciationManager.speak(
        text,
        { language },
        setAudioState
      );
    } catch (error) {
      console.error('Audio playback failed:', error);
      setTimeout(() => setAudioState('idle'), 2000);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'lg':
        return 'w-12 h-12 text-base';
      default:
        return 'w-10 h-10 text-sm';
    }
  };

  const getVariantClasses = () => {
    const baseClasses = 'relative overflow-hidden transition-all duration-200';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 rounded-xl border-2 border-blue-400/30`;
      case 'secondary':
        return `${baseClasses} bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 rounded-xl`;
      case 'minimal':
        return `${baseClasses} bg-gray-100/50 hover:bg-gray-200/70 text-gray-600 hover:text-gray-800 hover:scale-105 active:scale-95 rounded-lg border border-gray-200/50`;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  const renderIcon = () => {
    switch (audioState) {
      case 'loading':
        return <Loader2 className={`${getIconSize()} animate-spin`} />;
      case 'playing':
        return <Volume2 className={`${getIconSize()} animate-pulse`} />;
      case 'error':
        return <AlertCircle className={`${getIconSize()} text-red-500`} />;
      default:
        return <Volume2 className={getIconSize()} />;
    }
  };

  const getFlag = () => {
    return pronunciationManager.getLanguageFlag(language);
  };

  const isDisabled = disabled || !pronunciationManager.checkSupport();
  const isActive = audioState === 'playing' || audioState === 'loading';

  return (
    <button
      onClick={handlePlay}
      disabled={isDisabled}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isActive ? 'ring-2 ring-blue-300 ring-opacity-50 scale-105' : 'scale-100'}
        ${className}
        flex items-center justify-center space-x-1 font-medium
        disabled:transform-none disabled:hover:shadow-none disabled:scale-100
      `}
      title={`Listen to pronunciation in ${language}`}
    >
      {/* Background pulse effect when playing */}
      {audioState === 'playing' && (
        <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse" />
      )}
      
      {/* Icon */}
      <div className="relative z-10 flex items-center space-x-1">
        {renderIcon()}
        
        {/* Flag emoji for language */}
        {showFlag && (
          <span className="text-xs opacity-80">
            {getFlag()}
          </span>
        )}
        
        {/* Optional text */}
        {showText && (
          <span className="hidden sm:inline">
            Listen
          </span>
        )}
      </div>
      
      {/* Error state tooltip */}
      {audioState === 'error' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
          Audio not available
        </div>
      )}
    </button>
  );
}; 