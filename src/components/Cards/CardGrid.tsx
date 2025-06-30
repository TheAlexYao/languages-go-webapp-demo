import React, { useState, useMemo } from 'react';
import { Search, BookOpen, ChevronDown, ChevronUp, Target, Calendar, Flame, Globe, Trophy } from 'lucide-react';
import { VocabularyCard } from './VocabularyCard';
import { VocabularyCard as VocabularyCardType, CollectionStats } from '../../types/vocabulary';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface CardGridProps {
  cards: VocabularyCardType[];
  stats: CollectionStats;
  onCardClick?: (card: VocabularyCardType) => void;
  className?: string;
  targetLanguage?: string;
}

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'difficulty' | 'rarity';
type FilterOption = 'all' | 'common' | 'rare' | 'epic';

export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  stats,
  onCardClick,
  className = '',
  targetLanguage = 'es'
}) => {
  const { isMobile } = useMobileDetection();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    progress: false,
    achievements: false
  });

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

  // Calculate stats
  const todayCards = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return cards.filter(card => {
      if (!card.collectedAt) return false;
      const cardDate = new Date(card.collectedAt);
      cardDate.setHours(0, 0, 0, 0);
      return cardDate.getTime() === today.getTime();
    }).length;
  }, [cards]);

  const weeklyCards = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return cards.filter(card => {
      if (!card.collectedAt) return false;
      return new Date(card.collectedAt) >= oneWeekAgo;
    }).length;
  }, [cards]);

  const rarityStats = useMemo(() => {
    return {
      common: cards.filter(c => c.rarity === 'common').length,
      rare: cards.filter(c => c.rarity === 'rare').length,
      epic: cards.filter(c => c.rarity === 'epic').length
    };
  }, [cards]);

  const languageStats = useMemo(() => {
    const statsMap = cards.reduce((acc, card) => {
      acc[card.language] = (acc[card.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(statsMap).sort(([,a], [,b]) => b - a);
  }, [cards]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Simple Header */}
      <div className={`${isMobile ? 'px-4' : 'px-6'} pt-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-white mb-2`}>
              Your Collection
            </h1>
            <p className="text-gray-400 flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              {cards.length} {cards.length === 1 ? 'card' : 'cards'} collected
            </p>
          </div>
          <div className="text-right">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl">
              <div className="text-sm opacity-90">Level</div>
              <div className="text-xl font-bold">{stats.level}</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-white text-sm font-medium">Today</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{todayCards}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="h-4 w-4 text-green-400" />
              <span className="text-white text-sm font-medium">This Week</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{weeklyCards}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-white text-sm font-medium">Streak</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">{stats.streak}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-1">
              <Globe className="h-4 w-4 text-purple-400" />
              <span className="text-white text-sm font-medium">Languages</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{languageStats.length}</div>
          </div>
        </div>

        {/* Expandable Progress Section */}
        <div className="bg-white/5 rounded-xl border border-white/10 mb-6">
          <button
            onClick={() => toggleSection('progress')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors duration-200"
          >
            <span className="text-white font-medium">Progress Details</span>
            {expandedSections.progress ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.progress && (
            <div className="px-4 pb-4 space-y-4">
              {/* Rarity Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Cards by Rarity</h4>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-gray-300 text-sm">
                      <span className="font-semibold">{rarityStats.common}</span> Common
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300 text-sm">
                      <span className="font-semibold">{rarityStats.rare}</span> Rare
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-300 text-sm">
                      <span className="font-semibold">{rarityStats.epic}</span> Epic
                    </span>
                  </div>
                </div>
              </div>
              

            </div>
          )}
        </div>

        {/* Expandable Achievements Section */}
        {stats.achievements.length > 0 && (
          <div className="bg-white/5 rounded-xl border border-white/10 mb-6">
            <button
              onClick={() => toggleSection('achievements')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors duration-200"
            >
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-medium">Achievements</span>
                <span className="text-gray-400 text-sm">
                  ({stats.achievements.filter(a => a.unlockedAt).length} unlocked)
                </span>
              </div>
              {expandedSections.achievements ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.achievements && (
              <div className="px-4 pb-4">
                {/* Mobile: Horizontal Scrolling */}
                {isMobile ? (
                  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                    {stats.achievements
                      .filter(a => a.unlockedAt)
                      .map((achievement) => (
                        <div
                          key={achievement.id}
                          className="flex-shrink-0 w-64 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg p-4"
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{achievement.icon}</span>
                            <div className="text-yellow-200 font-medium text-sm">{achievement.name}</div>
                          </div>
                          <div className="text-yellow-300/70 text-xs leading-relaxed">{achievement.description}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  /* Desktop: Grid Layout */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {stats.achievements
                      .filter(a => a.unlockedAt)
                      .map((achievement) => (
                        <div
                          key={achievement.id}
                          className="flex items-center space-x-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg p-3"
                        >
                          <span className="text-lg">{achievement.icon}</span>
                          <div>
                            <div className="text-yellow-200 font-medium text-sm">{achievement.name}</div>
                            <div className="text-yellow-300/70 text-xs">{achievement.description}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                
                {/* Show hint for horizontal scrolling on mobile */}
                {isMobile && stats.achievements.filter(a => a.unlockedAt).length > 1 && (
                  <div className="text-center mt-3">
                    <div className="text-gray-400 text-xs flex items-center justify-center space-x-2">
                      <span>Swipe to see more</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search your cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Simple Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">A-Z</option>
            <option value="difficulty">Difficulty</option>
            <option value="rarity">Rarity</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
          </select>

          {languages.length > 2 && (
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Languages</option>
              {languages.slice(1).map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className={`${isMobile ? 'px-4' : 'px-6'} pb-6`}>
        {filteredAndSortedCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {cards.length === 0 ? 'No cards yet!' : 'No cards found'}
            </h3>
            <p className="text-gray-400">
              {cards.length === 0 
                ? 'Take some photos to start collecting vocabulary cards'
                : 'Try adjusting your search or filters'
              }
            </p>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            isMobile 
              ? 'grid-cols-1' 
              : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {filteredAndSortedCards.map((card) => (
              <VocabularyCard
                key={card.id}
                card={card}
                onClick={() => onCardClick?.(card)}
                className="hover:scale-105 transition-transform duration-200"
                selectedLanguage={targetLanguage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};