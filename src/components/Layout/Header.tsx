import React from 'react';
import { Trophy, Camera, Star } from 'lucide-react';
import { CollectionStats } from '../../types/vocabulary';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { Logo } from '../UI/Logo';

interface HeaderProps {
  stats: CollectionStats;
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({ stats, currentTab }) => {
  const { isMobile } = useMobileDetection();

  return (
    <header className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg ${isMobile ? 'p-3' : 'p-4'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Logo 
            size={isMobile ? 'md' : 'lg'} 
            showText={true}
            className="flex-shrink-0"
          />

          <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
            {/* Cards Collected */}
            <div className={`flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
              <Trophy className={`text-yellow-300 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {stats.totalCards}
              </span>
            </div>

            {/* Discoveries (Photos/Pins) */}
            <div className={`flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
              <Camera className={`text-cyan-300 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {stats.streak}
              </span>
            </div>

            {/* Level & XP */}
            <div className={`flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
              <Star className={`text-purple-300 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Lv{stats.level}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};