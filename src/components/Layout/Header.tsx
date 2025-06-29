import React, { useState } from 'react';
import { Trophy, Star, Globe, ChevronDown } from 'lucide-react';
import { CollectionStats } from '../../types/vocabulary';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { Logo } from '../UI/Logo';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
];

interface HeaderProps {
  stats: CollectionStats;
  currentTab: string;
  selectedLanguage?: string;
  onLanguageChange?: (languageCode: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ stats, currentTab, selectedLanguage = 'es', onLanguageChange }) => {
  const { isMobile } = useMobileDetection();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const currentLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === selectedLanguage) || AVAILABLE_LANGUAGES[0];

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange?.(languageCode);
    setIsDropdownOpen(false);
  };

  return (
    <header className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg ${isMobile ? 'p-3' : 'p-4'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Logo 
            size={isMobile ? 'lg' : 'xl'} 
            showText={true}
            className="flex-shrink-0"
          />

          <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
            {/* Cards Collected */}
            <div className={`flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-lg ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
              <Trophy className={`text-yellow-300 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {stats.totalCards}
              </span>
            </div>

            {/* Level & XP */}
            <div className={`flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-lg ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
              <Star className={`text-purple-300 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Lv{stats.level}
              </span>
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-all duration-200 border border-white/20 shadow-sm hover:shadow-md ${
                  isMobile 
                    ? 'px-2 py-1 space-x-1' 
                    : 'px-3 py-1.5 space-x-2'
                }`}
              >
                <Globe className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>{currentLanguage.flag}</span>
                {!isMobile && <span className="text-sm">{currentLanguage.name}</span>}
                <ChevronDown className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  
                  {/* Dropdown */}
                  <div className={`absolute right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20 ${
                    isMobile ? 'w-40' : 'w-48'
                  }`}>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      Learning Language
                    </div>
                    {AVAILABLE_LANGUAGES.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageSelect(language.code)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3 ${
                          selectedLanguage === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-lg">{language.flag}</span>
                        <span className="font-medium">{language.name}</span>
                        {selectedLanguage === language.code && (
                          <span className="ml-auto text-blue-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};