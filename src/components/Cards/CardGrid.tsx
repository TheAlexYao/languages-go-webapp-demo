import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, Sparkles, Trophy, Target, Flame, BookOpen, Globe, Calendar, TrendingUp } from 'lucide-react';
import { VocabularyCard } from './VocabularyCard';
import { VocabularyCard as VocabularyCardType, CollectionStats } from '../../types/vocabulary';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface CardGridProps {
  cards: VocabularyCardType[];
  stats: CollectionStats;
  onCardClick?: (card: VocabularyCardType) => void;
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'difficulty' | 'rarity';
type FilterOption = 'all' | 'common' | 'rare' | 'epic';

export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  stats,
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

  const languageStats = useMemo(() => {
    const statsMap = cards.reduce((acc, card) => {
      acc[card.language] = (acc[card.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(statsMap).sort(([,a], [,b]) => b - a);
  }, [cards]);

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

  // Dynamic goals based on user level
  const dailyGoal = useMemo(() => {
    return Math.max(3, Math.floor(stats.level * 1.5));
  }, [stats.level]);

  const weeklyGoal = useMemo(() => {
    return Math.max(10, stats.level * 5);
  }, [stats.level]);

  // Calculate weekly progress
  const weeklyCards = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return cards.filter(card => {
      if (!card.collectedAt) return false;
      return new Date(card.collectedAt) >= oneWeekAgo;
    }).length;
  }, [cards]);

  // Enhanced Progress ring component with glow effects
  const ProgressRing = ({ progress, total, color, size = 60, strokeWidth = 6, glowColor }: {
    progress: number;
    total: number;
    color: string;
    size?: number;
    strokeWidth?: number;
    glowColor?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progressPercentage = Math.min((progress / total) * 100, 100);
    const strokeDasharray = `${(progressPercentage / 100) * circumference} ${circumference}`;
    const isComplete = progress >= total;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/20"
          />
          {/* Progress circle with glow */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: isComplete ? `drop-shadow(0 0 8px ${glowColor || color})` : 'none'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${isComplete ? 'text-white' : 'text-gray-300'} transition-colors duration-300`}>
            {progress}/{total}
          </span>
        </div>
        {/* Completion sparkle */}
        {isComplete && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-lg"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Stats Dashboard */}
      <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl ${isMobile ? 'p-6 mx-2' : 'p-8'} border border-slate-700/50 shadow-2xl relative overflow-hidden`}>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.2),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(119,198,255,0.2),transparent_50%)]" />
        </div>

        {/* Floating decorative elements - removed on mobile */}
        {!isMobile && (
          <>
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-xl"></div>
          </>
        )}

        <div className="relative z-10">
          {/* Header with enhanced styling */}
          <div className={`flex items-center justify-between ${isMobile ? 'mb-6' : 'mb-8'}`}>
            <div>
              <h2 className={`${isMobile ? 'text-xl' : 'text-4xl'} font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent ${isMobile ? 'mb-2' : 'mb-3'} leading-tight`}>
                Your Collection
              </h2>
              <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'} flex items-center`}>
                <BookOpen className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-blue-400`} />
                <span className="text-white font-medium">{filteredAndSortedCards.length}</span>
                <span className="mx-1">of</span>
                <span className="text-white font-medium">{cards.length}</span>
                <span className="ml-1">cards</span>
                {searchTerm && !isMobile && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-blue-300">Filtered by "{searchTerm}"</span>
                  </>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="relative">
                <div className={`${isMobile ? 'text-xl' : 'text-3xl'} mb-1 transform hover:scale-110 transition-transform duration-300`}>🏆</div>
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm`}>
                Level {stats.level}
              </div>
              {/* XP Progress Bar */}
              <div className="mt-2 w-16 bg-white/20 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-1 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${((stats.xp % 100) / 100) * 100}%` 
                  }}
                ></div>
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1`}>
                {stats.xp % 100}/100 XP
              </div>
            </div>
          </div>

          {/* Progress Stats Grid with enhanced cards */}
          <div className={`grid grid-cols-2 ${isMobile ? 'gap-3 mb-6' : 'gap-6 mb-8'}`}>
            {/* Daily Goal */}
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
                  <div className="flex items-center space-x-2">
                    <Target className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-400 group-hover:text-blue-300 transition-colors duration-300`} />
                    <span className={`text-white font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Daily Goal</span>
                  </div>
                  <ProgressRing 
                    progress={todayCards} 
                    total={dailyGoal} 
                    color="#60A5FA" 
                    glowColor="#3B82F6"
                    size={isMobile ? 32 : 40}
                    strokeWidth={isMobile ? 3 : 4}
                  />
                </div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-300`}>
                  {todayCards >= dailyGoal ? (
                    <span className="text-green-400 font-medium">🎉 Goal reached!</span>
                  ) : (
                    <span>{dailyGoal - todayCards} more today</span>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
                  <div className="flex items-center space-x-2">
                    <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-400 group-hover:text-green-300 transition-colors duration-300`} />
                    <span className={`text-white font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>This Week</span>
                  </div>
                  <ProgressRing 
                    progress={weeklyCards} 
                    total={weeklyGoal} 
                    color="#34D399" 
                    glowColor="#10B981"
                    size={isMobile ? 32 : 40}
                    strokeWidth={isMobile ? 3 : 4}
                  />
                </div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-300`}>
                  {weeklyCards >= weeklyGoal ? (
                    <span className="text-orange-400 font-medium">🔥 On fire!</span>
                  ) : (
                    <span>Keep going!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Streak */}
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className={`flex items-center space-x-2 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                  <Flame className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-orange-400 group-hover:text-orange-300 transition-colors duration-300`} />
                  <span className={`text-white font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Streak</span>
                </div>
                <div className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-orange-400 mb-1 group-hover:text-orange-300 transition-colors duration-300`}>
                  {stats.streak}
                </div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-300`}>
                  {stats.streak === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className={`flex items-center space-x-2 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                  <Globe className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-purple-400 group-hover:text-purple-300 transition-colors duration-300`} />
                  <span className={`text-white font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Languages</span>
                </div>
                <div className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-purple-400 mb-1 group-hover:text-purple-300 transition-colors duration-300`}>{languageStats.length}</div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-300`}>
                  {languageStats.length > 0 && languageStats[0][0]}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Rarity Breakdown */}
          <div className={`flex items-center justify-between bg-white/5 rounded-2xl ${isMobile ? 'p-3' : 'p-4'} border border-white/10`}>
            <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-6'}`}>
              <div className="flex items-center space-x-2 group cursor-pointer">
                <div className="w-3 h-3 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full group-hover:shadow-lg group-hover:shadow-gray-400/50 transition-all duration-300"></div>
                <span className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'} group-hover:text-white transition-colors duration-300`}>
                  <span className="font-semibold">{rarityStats.common}</span> {isMobile ? '' : 'Common'}
                </span>
              </div>
              <div className="flex items-center space-x-2 group cursor-pointer">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full group-hover:shadow-lg group-hover:shadow-blue-400/50 transition-all duration-300"></div>
                <span className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'} group-hover:text-white transition-colors duration-300`}>
                  <span className="font-semibold">{rarityStats.rare}</span> {isMobile ? '' : 'Rare'}
                </span>
              </div>
              <div className="flex items-center space-x-2 group cursor-pointer">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full group-hover:shadow-lg group-hover:shadow-purple-400/50 transition-all duration-300"></div>
                <span className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'} group-hover:text-white transition-colors duration-300`}>
                  <span className="font-semibold">{rarityStats.epic}</span> {isMobile ? '' : 'Epic'}
                </span>
              </div>
            </div>
            
            {cards.length > 0 && (
              <div className={`flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 ${isMobile ? 'px-2 py-1' : 'px-4 py-2'} rounded-full border border-green-400/30 backdrop-blur-sm`}>
                <TrendingUp className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-green-400`} />
                <span className={`text-green-400 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>+{todayCards}</span>
              </div>
            )}
          </div>

          {/* Achievements Section */}
          {stats.achievements.length > 0 && (
            <div className={`bg-white/5 rounded-2xl ${isMobile ? 'p-3' : 'p-4'} border border-white/10`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-white font-medium ${isMobile ? 'text-sm' : 'text-base'} flex items-center`}>
                  <Trophy className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2 text-yellow-400`} />
                  Recent Achievements
                </h3>
                <span className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {stats.achievements.filter(a => a.unlockedAt).length} unlocked
                </span>
              </div>
              <div className={`flex flex-wrap gap-2 ${isMobile ? 'max-h-16' : 'max-h-20'} overflow-hidden`}>
                {stats.achievements
                  .filter(a => a.unlockedAt)
                  .slice(0, isMobile ? 3 : 6)
                  .map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-full px-3 py-1 group hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-300"
                      title={achievement.description}
                    >
                      <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>{achievement.icon}</span>
                      <span className={`text-yellow-200 font-medium ${isMobile ? 'text-xs' : 'text-sm'} group-hover:text-yellow-100 transition-colors duration-300`}>
                        {achievement.name}
                      </span>
                    </div>
                  ))}
                {stats.achievements.filter(a => a.unlockedAt).length > (isMobile ? 3 : 6) && (
                  <div className="flex items-center justify-center bg-white/10 border border-white/20 rounded-full px-3 py-1">
                    <span className={`text-gray-300 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      +{stats.achievements.filter(a => a.unlockedAt).length - (isMobile ? 3 : 6)} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className={`space-y-4 ${isMobile ? 'px-2' : ''}`}>
        {/* Search Bar with enhanced styling */}
        <div className="relative group">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200`} />
          <input
            type="text"
            placeholder="Search your cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-2xl shadow-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white group-hover:shadow-xl ${isMobile ? 'pl-10 pr-4 py-3 text-sm' : 'pl-12 pr-4 py-4'}`}
          />
        </div>

        {/* Enhanced Filter Pills */}
        <div className={`flex flex-wrap gap-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={`bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-gray-700 font-medium ${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2'} rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-md focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer`}
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
            className={`bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-gray-700 font-medium ${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2'} rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-md focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer`}
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
            className={`bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-gray-700 font-medium ${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2'} rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-md focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer`}
          >
            <option value="all">All Languages</option>
            {languages.slice(1).map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Enhanced Clear Filters */}
        {(searchTerm || filterBy !== 'all' || selectedLanguage !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterBy('all');
              setSelectedLanguage('all');
            }}
            className={`flex items-center space-x-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium ${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2'} rounded-xl transition-all duration-200 shadow-md border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transform hover:scale-105`}
          >
            <span>Clear All Filters</span>
          </button>
        )}
      </div>

      {/* Cards Grid */}
      {filteredAndSortedCards.length > 0 ? (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3 px-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'}`}>
          {filteredAndSortedCards.map((card) => (
            <VocabularyCard
              key={card.id}
              card={card}
              isCollected={true}
              onClick={() => onCardClick?.(card)}
              className="transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
            />
          ))}
        </div>
      ) : (
        <div className={`text-center ${isMobile ? 'py-8 px-4' : 'py-16'}`}>
          <div className={`${isMobile ? 'w-16 h-16' : 'w-24 h-24'} bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}>
            <Search className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'} text-gray-400`} />
          </div>
          <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 mb-3`}>No cards found</h3>
          <p className={`text-gray-600 max-w-md mx-auto leading-relaxed ${isMobile ? 'text-sm px-4' : ''}`}>
            {searchTerm || filterBy !== 'all' || selectedLanguage !== 'all'
              ? 'Try adjusting your search or filters to find more cards.'
              : 'Start exploring with your camera to collect your first vocabulary cards!'
            }
          </p>
          {!cards.length && (
            <div className="mt-6">
              <div className={`inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 ${isMobile ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm'} rounded-2xl font-medium shadow-lg border border-blue-200`}>
                <Sparkles className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span>Take a photo to get started!</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};