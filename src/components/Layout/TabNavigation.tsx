import React from 'react';
import { Map, BookOpen, Users, Camera } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'camera' | 'map' | 'collection' | 'community';
  onTabChange: (tab: 'camera' | 'map' | 'collection' | 'community') => void;
  isMobile: boolean;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  isMobile
}) => {
  const tabs = [
    { id: 'camera' as const, icon: Camera, label: 'Discover' },
    { id: 'map' as const, icon: Map, label: 'Explore' },
    { id: 'collection' as const, icon: BookOpen, label: 'Collection' },
    { id: 'community' as const, icon: Users, label: 'Community' }
  ];

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-800/95 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl ${
        isMobile ? '' : 'w-full'
      }`}
      style={{ zIndex: 50 }}
    >
      {/* Safe area padding for devices with home indicators */}
      <div className="pb-safe">
        <div className={`flex items-center justify-around py-2 px-2 ${isMobile ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 relative ${isMobile ? 'min-w-[70px]' : 'min-w-[100px]'} ${
                activeTab === id
                  ? 'text-white bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-lg scale-105'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/30 hover:scale-105 active:scale-95'
              }`}
            >
              <div className={`relative ${activeTab === id ? 'transform scale-110' : ''} transition-transform duration-300`}>
                <Icon className="h-5 w-5 mb-1" />
                
                {/* Active indicator */}
                {activeTab === id && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full shadow-lg animate-pulse" />
                )}
              </div>
              
              <span className={`text-xs font-medium transition-all duration-300 ${
                activeTab === id ? 'text-white' : 'text-gray-400'
              }`}>
                {label}
              </span>
              

            </button>
          ))}
        </div>
      </div>
    </div>
  );
};