import React from 'react';
import { Trophy, Zap, Target, Star } from 'lucide-react';
import { CollectionStats } from '../../types/vocabulary';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface HeaderProps {
  stats: CollectionStats;
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({ stats, currentTab }) => {
  const { isMobile } = useMobileDetection();
  
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'camera': return 'Discover';
      case 'map': return 'Explore';
      case 'collection': return 'Collection';
      case 'community': return 'Community';
      default: return 'Languages Go';
    }
  };

  const getTabDescription = (tab: string) => {
    switch (tab) {
      case 'camera': return 'Capture the world around you';
      case 'map': return 'See your discoveries on the map';
      case 'collection': return 'Your vocabulary collection';
      case 'community': return 'Connect with other learners';
      default: return 'Learn languages through exploration';
    }
  };

  const xpToNextLevel = (stats.level * 100) - stats.xp;
  const levelProgress = (stats.xp % 100) / 100;

  if (isMobile) {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Title Section - Compact for mobile */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Star className="h-3 w-3 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {getTabTitle(currentTab)}
              </h1>
            </div>
          </div>

          {/* Compact Stats for Mobile */}
          <div className="flex items-center space-x-3">
            {/* Level */}
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <Trophy className="h-3 w-3 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-white leading-none">{stats.level}</p>
                <div className="w-8 h-1 bg-slate-700 rounded-full overflow-hidden mt-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${levelProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                <Target className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-bold text-white">{stats.totalCards}</span>
            </div>

            {/* Streak */}
            {stats.streak > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Zap className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-bold text-white">{stats.streak}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop version remains the same
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Title Section */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Star className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {getTabTitle(currentTab)}
            </h1>
          </div>
          <p className="text-sm text-gray-400 ml-11">
            {getTabDescription(currentTab)}
          </p>
        </div>

        {/* Stats Section */}
        <div className="flex items-center space-x-6">
          {/* Level & XP */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Level {stats.level}</p>
                <p className="text-xs text-gray-400">{xpToNextLevel} XP to next</p>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${levelProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Streak */}
          {stats.streak > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{stats.streak}</p>
                <p className="text-xs text-gray-400">day streak</p>
              </div>
            </div>
          )}

          {/* Total Cards */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{stats.totalCards}</p>
              <p className="text-xs text-gray-400">cards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};