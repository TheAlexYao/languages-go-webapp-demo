import React, { useState, useEffect } from 'react';
import { Star, BookOpen, Trophy, Sparkles, Loader2 } from 'lucide-react';
import { VocabularyCard as VocabularyCardType } from '../../types/vocabulary';
import { AudioButton } from '../UI/AudioButton';
import { getStickerUrl, needsSticker } from '../../services/stickers/stickerIntegration';

interface VocabularyCardProps {
  card: VocabularyCardType;
  onCollect?: (card: VocabularyCardType) => void;
  isCollected?: boolean;
  showCollectButton?: boolean;
  onClick?: () => void;
  className?: string;
  showAudioButton?: boolean;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({
  card,
  onCollect,
  isCollected = false,
  showCollectButton = false,
  onClick,
  className = '',
  showAudioButton = true
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [stickerGenerating, setStickerGenerating] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(getStickerUrl(card));

  // Update image URL when card data changes
  useEffect(() => {
    const newImageUrl = getStickerUrl(card);
    setCurrentImageUrl(newImageUrl);
    
    // Check if we need to generate a sticker
    if (needsSticker(card)) {
      setStickerGenerating(true);
      
      // Poll for sticker completion (simplified - in production you'd use websockets or polling)
      const checkSticker = setInterval(async () => {
        try {
          const stickerUrl = getStickerUrl(card);
          if (stickerUrl !== currentImageUrl && !stickerUrl.startsWith('data:image/svg')) {
            setCurrentImageUrl(stickerUrl);
            setStickerGenerating(false);
            clearInterval(checkSticker);
          }
        } catch (error) {
          console.error('Error checking sticker status:', error);
        }
      }, 5000); // Check every 5 seconds

      // Cleanup after 2 minutes
      setTimeout(() => {
        clearInterval(checkSticker);
        setStickerGenerating(false);
      }, 120000);

      return () => clearInterval(checkSticker);
    } else {
      setStickerGenerating(false);
    }
  }, [card.aiImageUrl, card.word]); // React to changes in the card's image URL

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'epic': return 'from-purple-600 via-pink-500 to-purple-600';
      case 'rare': return 'from-blue-600 via-cyan-500 to-blue-600';
      default: return 'from-slate-600 via-gray-500 to-slate-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'epic': return 'border-purple-400/50 shadow-purple-500/25';
      case 'rare': return 'border-blue-400/50 shadow-blue-500/25';
      default: return 'border-gray-400/30 shadow-gray-500/10';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'epic': return 'shadow-2xl shadow-purple-500/20';
      case 'rare': return 'shadow-2xl shadow-blue-500/20';
      default: return 'shadow-xl shadow-gray-500/10';
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsFlipped(!isFlipped);
    }
  };

  const handleCollect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCollect && !isCollected) {
      onCollect(card);
    }
  };

  const displayImageUrl = currentImageUrl || getStickerUrl(card);

  return (
    <div 
      className={`
        relative w-full aspect-[3/4] cursor-pointer group perspective-1000
        ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Sticker Generation Indicator */}
      {stickerGenerating && (
        <div className="absolute top-1 right-1 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1 shadow-lg">
          <Sparkles className="h-3 w-3 animate-pulse" />
          <span>Generating sticker...</span>
        </div>
      )}

      <div className={`
        relative w-full h-full transition-transform duration-700 transform-style-preserve-3d
        ${isFlipped ? 'rotate-y-180' : ''}
      `}>
        {/* Front of card */}
        <div className={`
          absolute inset-0 w-full h-full backface-hidden
          bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl border-2 
          ${getRarityBorder(card.rarity)} ${getRarityGlow(card.rarity)}
          overflow-hidden transform-gpu transition-all duration-300
          hover:scale-105 hover:shadow-2xl
        `}>
          {/* Rarity gradient header */}
          <div className={`h-3 bg-gradient-to-r ${getRarityGradient(card.rarity)} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
          
          {/* Rarity indicator */}
          {card.rarity !== 'common' && (
            <div className="absolute top-3 right-3 z-10">
              <div className={`
                w-8 h-8 rounded-full bg-gradient-to-br ${getRarityGradient(card.rarity)} 
                flex items-center justify-center shadow-lg border-2 border-white/50
              `}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
          
          {/* Card content */}
          <div className="p-5 h-full flex flex-col">
            {/* AI Generated Image */}
            <div className="relative h-32 overflow-hidden rounded-lg">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />
                </div>
              )}
              
              {/* Sticker generation overlay */}
              {stickerGenerating && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <Sparkles className="h-6 w-6 text-purple-600 animate-pulse mx-auto mb-1" />
                    <p className="text-xs text-purple-700 font-medium">Creating sticker...</p>
                  </div>
                </div>
              )}

              <img
                src={displayImageUrl}
                alt={card.word}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                } ${imageError ? 'hidden' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
              
              {imageError && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                  <div className="text-center text-slate-600">
                    <div className="text-2xl mb-1">📷</div>
                    <div className="text-xs">Image not available</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Word and translation */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-1 tracking-tight">{card.word}</h3>
              <p className="text-gray-600 font-medium">{card.translation}</p>
            </div>
            
            {/* Language and difficulty */}
            <div className="flex items-center justify-between mb-4">
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                {card.language}
              </span>
              <div className="flex items-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 transition-colors duration-200 ${
                      i < card.difficulty ? 'text-yellow-400 fill-current drop-shadow-sm' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center justify-between">
              {showAudioButton && (
                <AudioButton
                  text={card.word}
                  language={card.language}
                  size="sm"
                  variant="secondary"
                  showFlag={true}
                  showText={false}
                />
              )}
              
              {showCollectButton && !isCollected && (
                <button
                  onClick={handleCollect}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Collect
                </button>
              )}
              
              {isCollected && (
                <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-bold">Collected</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Back of card */}
        <div className={`
          absolute inset-0 w-full h-full backface-hidden rotate-y-180
          bg-gradient-to-br ${getRarityGradient(card.rarity)} rounded-3xl shadow-2xl
          overflow-hidden transform-gpu border-2 border-white/20
        `}>
          <div className="p-6 h-full flex flex-col text-white relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">{card.word}</h3>
                <p className="text-lg opacity-90 font-medium">{card.translation}</p>
              </div>
              
              <div className="flex-1 space-y-5">
                {/* Pronunciation */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold flex items-center">
                      <span className="mr-2">🔊</span>
                      Pronunciation
                    </h4>
                    <AudioButton
                      text={card.word}
                      language={card.language}
                      size="sm"
                      variant="minimal"
                      showFlag={false}
                      showText={false}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    />
                  </div>
                  <p className="text-sm opacity-90 font-mono">{card.pronunciation || `/${card.word}/`}</p>
                </div>
                
                {/* Example sentence */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <h4 className="font-bold mb-2 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Example
                  </h4>
                  <p className="text-sm opacity-90 italic leading-relaxed">
                    {card.exampleSentence || `This is a ${card.word}.`}
                  </p>
                </div>
                
                {/* Category */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <h4 className="font-bold mb-2">Category</h4>
                  <p className="text-sm opacity-90 capitalize font-medium">{card.category}</p>
                </div>
              </div>
              
              {/* Rarity indicator */}
              <div className="text-center mt-6">
                <span className="text-xs font-bold uppercase tracking-wider opacity-75 bg-white/20 px-3 py-1 rounded-full">
                  {card.rarity} Card
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl pointer-events-none" />
    </div>
  );
};