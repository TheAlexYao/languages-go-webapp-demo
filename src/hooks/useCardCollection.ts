import { useState, useCallback, useEffect } from 'react';
import { VocabularyCard, CollectionStats, Achievement } from '../types/vocabulary';

const STORAGE_KEY = 'languages-go-collection';
const STATS_KEY = 'languages-go-stats';

const defaultStats: CollectionStats = {
  totalCards: 0,
  uniqueWords: 0,
  languages: [],
  streak: 0,
  level: 1,
  xp: 0,
  achievements: []
};

const achievements: Achievement[] = [
  {
    id: 'first-card',
    name: 'First Discovery',
    description: 'Collect your first vocabulary card',
    icon: '🎉'
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Discover 10 different locations',
    icon: '🗺️',
    maxProgress: 10
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Collect 25 vocabulary cards',
    icon: '📚',
    maxProgress: 25
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Learn words in 3 different languages',
    icon: '🌍',
    maxProgress: 3
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    maxProgress: 7
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Collect 50 vocabulary cards',
    icon: '👑',
    maxProgress: 50
  }
];

export const useCardCollection = () => {
  const [collectedCards, setCollectedCards] = useState<VocabularyCard[]>([]);
  const [stats, setStats] = useState<CollectionStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    try {
      const savedCards = localStorage.getItem(STORAGE_KEY);
      const savedStats = localStorage.getItem(STATS_KEY);
      
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        setCollectedCards(cards);
      }
      
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setStats({ ...defaultStats, ...parsedStats });
      }
    } catch (error) {
      console.error('Failed to load collection data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectedCards));
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
  }, [collectedCards, stats, isLoading]);

  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 100) + 1;
  };

  const checkAchievements = useCallback((newStats: CollectionStats, cards: VocabularyCard[]): Achievement[] => {
    const newAchievements: Achievement[] = [];
    
    achievements.forEach(achievement => {
      const isAlreadyUnlocked = newStats.achievements.some(a => a.id === achievement.id);
      if (isAlreadyUnlocked) return;
      
      let shouldUnlock = false;
      let progress = 0;
      
      switch (achievement.id) {
        case 'first-card':
          shouldUnlock = cards.length >= 1;
          break;
        case 'collector':
          progress = cards.length;
          shouldUnlock = cards.length >= 25;
          break;
        case 'polyglot':
          progress = newStats.languages.length;
          shouldUnlock = newStats.languages.length >= 3;
          break;
        case 'streak-master':
          progress = newStats.streak;
          shouldUnlock = newStats.streak >= 7;
          break;
        case 'legend':
          progress = cards.length;
          shouldUnlock = cards.length >= 50;
          break;
        case 'explorer':
          // This would need pin data, simplified for now
          progress = Math.min(cards.length / 2, 10);
          shouldUnlock = cards.length >= 20;
          break;
      }
      
      if (shouldUnlock) {
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date(),
          progress: achievement.maxProgress
        });
      } else if (achievement.maxProgress && progress > 0) {
        // Update progress for incomplete achievements
        const existingIndex = newStats.achievements.findIndex(a => a.id === achievement.id);
        if (existingIndex === -1) {
          newStats.achievements.push({
            ...achievement,
            progress
          });
        }
      }
    });
    
    return newAchievements;
  }, []);

  const collectCard = useCallback((card: VocabularyCard) => {
    const collectedCard = {
      ...card,
      collectedAt: new Date()
    };
    
    setCollectedCards(prev => {
      const newCards = [collectedCard, ...prev];
      
      // Update stats
      setStats(currentStats => {
        const uniqueWords = new Set(newCards.map(c => c.word.toLowerCase())).size;
        const languages = Array.from(new Set(newCards.map(c => c.language)));
        const xpGain = card.difficulty * 10 + (card.rarity === 'epic' ? 50 : card.rarity === 'rare' ? 20 : 0);
        const newXp = currentStats.xp + xpGain;
        const newLevel = calculateLevel(newXp);
        
        const newStats: CollectionStats = {
          ...currentStats,
          totalCards: newCards.length,
          uniqueWords,
          languages,
          xp: newXp,
          level: newLevel
        };
        
        // Check for new achievements
        const newAchievements = checkAchievements(newStats, newCards);
        if (newAchievements.length > 0) {
          newStats.achievements = [...currentStats.achievements, ...newAchievements];
        }
        
        return newStats;
      });
      
      return newCards;
    });
  }, [checkAchievements]);

  const getCardsByLanguage = useCallback((language: string) => {
    return collectedCards.filter(card => card.language === language);
  }, [collectedCards]);

  const getCardsByRarity = useCallback((rarity: 'common' | 'rare' | 'epic') => {
    return collectedCards.filter(card => card.rarity === rarity);
  }, [collectedCards]);

  const clearCollection = useCallback(() => {
    setCollectedCards([]);
    setStats(defaultStats);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATS_KEY);
  }, []);

  return {
    collectedCards,
    stats,
    isLoading,
    collectCard,
    getCardsByLanguage,
    getCardsByRarity,
    clearCollection
  };
};