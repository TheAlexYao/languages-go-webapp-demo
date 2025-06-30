import React from 'react';
import { X, BookOpen, MapPin, Calendar, Star, Trophy } from 'lucide-react';
import { VocabularyCard } from '../../types/vocabulary';
import { AudioButton } from '../UI/AudioButton';
import { getStickerUrl } from '../../services/stickers/stickerIntegration';

interface CardModalProps {
  card: VocabularyCard;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>

        {/* Header with gradient */}
        <div className={`h-32 bg-gradient-to-br ${getRarityColor(card.rarity)} relative`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative h-full flex items-center justify-center text-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">{card.word}</h2>
              <p className="text-lg opacity-90">{card.translation}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sticker Image */}
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100">
              <img
                src={getStickerUrl(card)}
                alt={card.word}
                className="w-full h-full object-contain p-2"
              />
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-4">
            {/* Language and Difficulty */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {card.language}
                </span>
                <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full capitalize">
                  {card.category}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < card.difficulty ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Pronunciation */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🔊</span>
                  Pronunciation
                </h3>
                <AudioButton
                  text={card.word}
                  language={card.language}
                  size="md"
                  variant="primary"
                  showFlag={true}
                  showText={true}
                />
              </div>
              <p className="text-gray-600">{card.pronunciation || `/${card.word}/`}</p>
            </div>

            {/* Example Sentence */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Example Usage
              </h3>
              <p className="text-gray-600 italic">
                {card.exampleSentence || `This is a ${card.word}.`}
              </p>
            </div>

            {/* Collection Info */}
            {card.collectedAt && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Collection Details
                </h3>
                <div className="space-y-1 text-sm text-green-700">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-2" />
                    Collected on {new Date(card.collectedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-2" />
                    Pin ID: {card.pinId.slice(-8)}
                  </div>
                </div>
              </div>
            )}

            {/* Rarity Badge */}
            <div className="text-center">
              <span className={`
                inline-block px-4 py-2 rounded-full text-white font-medium text-sm
                bg-gradient-to-r ${getRarityColor(card.rarity)}
              `}>
                {card.rarity.toUpperCase()} CARD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};