import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, Sparkles, Trophy } from 'lucide-react';
import { VocabularyCard } from './VocabularyCard';
import { VocabularyCard as VocabularyCardType } from '../../types/vocabulary';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface CardGridProps {
  cards: VocabularyCardType[];
  onCardClick?: (card: VocabularyCardType) => void;
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'difficulty' | 'rarity';
type FilterOption = 'all' | 'common' | 'rare' | 'epic';

export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  onCardClick,
  className = ''
}) => {
  const { isMobile } = useMobileDetection();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  // Get unique languages
  const languages = useMemo(() => {
    const langs = Array.from(new Set(cards.map(card => card.language)));
    return ['all', ...langs];
  }, [cards]);

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards.filter(card => {
      const matchesSearch = card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.translation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRarity = filterBy === 'all' || card.rarity === filterBy;
      const matchesLanguage = selectedLanguage === 'all' || card.language === selectedLanguage;
      
      return matchesSearch && matchesRarity && matchesLanguage;
    });

    // Sort cards
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.collectedAt || 0).getTime() - new Date(a.collectedAt || 0).getTime();
        case 'oldest':
          return new Date(a.collectedAt || 0).getTime() - new Date(b.collectedAt || 0).getTime();
        case 'alphabetical':
          return a.word.localeCompare(b.word);
        case 'difficulty':
          return b.difficulty - a.difficulty;
        case 'rarity':
          const rarityOrder = { epic: 3, rare: 2, common: 1 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        default:
          return 0;
      }
    });

    return filtered;
  }, [cards, searchTerm, sortBy, filterBy, selectedLanguage]);

  const rarityStats = useMemo(() => {
    return {
      common: cards.filter(c => c.rarity === 'common').length,
      rare: cards.filter(c => c.rarity === 'rare').length,
      epic: cards.filter(c => c.rarity === 'epic').length
    };
  }, [cards]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className={`bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl ${isMobile ? 'p-4' : 'p-6'} border border-slate-600/50 shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-1`}>Your Collection</h2>
            <p className="text-gray-300 text-sm">
              {filteredAndSortedCards.length} of {cards.length} cards
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-center">
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-1`}>
                <Trophy className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
              </div>
              <p className="text-xs text-gray-400">Total</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-600/30 rounded-xl p-3 text-center border border-slate-500/30">
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-1`}>{rarityStats.common}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Common</div>
          </div>
          <div className="bg-blue-500/20 rounded-xl p-3 text-center border border-blue-400/30">
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-300 mb-1`}>{rarityStats.rare}</div>
            <div className="text-xs text-blue-400 uppercase tracking-wide">Rare</div>
          </div>
          <div className="bg-purple-500/20 rounded-xl p-3 text-center border border-purple-400/30">
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-300 mb-1`}>{rarityStats.epic}</div>
            <div className="text-xs text-purple-400 uppercase tracking-wide">Epic</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search your cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 ${isMobile ? 'py-3' : 'py-4'} bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-500 shadow-lg`}
          />
        </div>

        {/* Filters Row */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-4 gap-3'}`}>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={`px-3 ${isMobile ? 'py-2 text-sm' : 'py-3'} bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-lg`}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">A-Z</option>
            <option value="difficulty">Difficulty</option>
            <option value="rarity">Rarity</option>
          </select>

          {/* Rarity Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className={`px-3 ${isMobile ? 'py-2 text-sm' : 'py-3'} bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-lg`}
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className={`px-3 ${isMobile ? 'py-2 text-sm' : 'py-3'} bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-lg ${isMobile ? 'col-span-2' : ''}`}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {lang === 'all' ? 'All Languages' : lang}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchTerm || filterBy !== 'all' || selectedLanguage !== 'all') && !isMobile && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterBy('all');
                setSelectedLanguage('all');
              }}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-2xl transition-all duration-200 shadow-lg border-2 border-gray-200"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Mobile Clear Button */}
        {(searchTerm || filterBy !== 'all' || selectedLanguage !== 'all') && isMobile && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterBy('all');
              setSelectedLanguage('all');
            }}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 shadow-lg border-2 border-gray-200 text-sm"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Cards Grid */}
      {filteredAndSortedCards.length > 0 ? (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'}`}>
          {filteredAndSortedCards.map((card) => (
            <VocabularyCard
              key={card.id}
              card={card}
              isCollected={true}
              onClick={() => onCardClick?.(card)}
              className="transform hover:scale-105 transition-all duration-300"
            />
          ))}
        </div>
      ) : (
        <div className={`text-center ${isMobile ? 'py-12' : 'py-16'}`}>
          <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <Search className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400`} />
          </div>
          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800 mb-3`}>No cards found</h3>
          <p className={`text-gray-600 max-w-md mx-auto leading-relaxed ${isMobile ? 'text-sm px-4' : ''}`}>
            {searchTerm || filterBy !== 'all' || selectedLanguage !== 'all'
              ? 'Try adjusting your search or filters to find more cards.'
              : 'Start exploring with your camera to collect your first vocabulary cards!'
            }
          </p>
          {!cards.length && (
            <div className="mt-6">
              <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl font-medium text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Take a photo to get started!</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};