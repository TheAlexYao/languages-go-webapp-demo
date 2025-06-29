import { useState, useCallback, useEffect } from 'react';
import { VocabularyCard, CollectionStats, Achievement } from '../types/vocabulary';
import { getUserCollectedCards, collectCard as supabaseCollectCard } from '../services/supabase';

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

export const useCardCollection = (isAuthenticated: boolean = false) => {
  const [collectedCards, setCollectedCards] = useState<VocabularyCard[]>([]);
  const [stats, setStats] = useState<CollectionStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 100) + 1;
  };



  const updateStatsFromCards = useCallback((cards: VocabularyCard[]) => {
    setStats(currentStats => {
      const uniqueWords = new Set(cards.map(c => c.word.toLowerCase())).size;
      const languages = Array.from(new Set(cards.map(c => c.language)));
      
      // Calculate total XP based on cards
      const totalXp = cards.reduce((xp, card) => {
        const baseXp = card.difficulty * 10;
        const rarityBonus = card.rarity === 'epic' ? 50 : card.rarity === 'rare' ? 20 : 0;
        return xp + baseXp + rarityBonus;
      }, 0);
      
      const newLevel = calculateLevel(totalXp);
      
      const newStats: CollectionStats = {
        ...currentStats,
        totalCards: cards.length,
        uniqueWords,
        languages,
        xp: totalXp,
        level: newLevel
      };
      
      // Check for new achievements inline to avoid dependency issues
      const newAchievements: Achievement[] = [];
      
      achievements.forEach(achievement => {
        const isAlreadyUnlocked = currentStats.achievements.some(a => a.id === achievement.id);
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
          const existingIndex = newStats.achievements.findIndex(a => a.id === achievement.id);
          if (existingIndex === -1) {
            newStats.achievements.push({
              ...achievement,
              progress
            });
          }
        }
      });
      
      if (newAchievements.length > 0) {
        newStats.achievements = [...currentStats.achievements, ...newAchievements];
      }
      
      return newStats;
    });
  }, []); // Remove the dependency to prevent infinite loops

  // Load data from Supabase and localStorage (for stats)
  useEffect(() => {
    const loadData = async () => {
      // Don't load data if user is not authenticated
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        // Load collected cards from Supabase
        const supabaseCards = await getUserCollectedCards();
        setCollectedCards(supabaseCards);
        
        // Load stats from localStorage (will migrate to Supabase later)
        const savedStats = localStorage.getItem(STATS_KEY);
        if (savedStats) {
          const parsedStats = JSON.parse(savedStats);
          setStats({ ...defaultStats, ...parsedStats });
        }
        
        // Recalculate stats based on current cards
        updateStatsFromCards(supabaseCards);
        
      } catch (error) {
        console.error('Failed to load collection data:', error);
        // Fallback to empty collection on error
        setCollectedCards([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isAuthenticated, updateStatsFromCards]);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
  }, [stats, isLoading]);

  const collectCard = useCallback(async (card: VocabularyCard) => {
    try {
      // Save to Supabase
      await supabaseCollectCard(card);
      
      // Update local state
      const collectedCard = {
        ...card,
        collectedAt: new Date()
      };
      
      setCollectedCards(prev => {
        const newCards = [collectedCard, ...prev];
        
        // Update stats based on new collection
        updateStatsFromCards(newCards);
        
        return newCards;
      });
      
    } catch (error) {
      console.error('Failed to collect card:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [updateStatsFromCards]);

  const getCardsByLanguage = useCallback((language: string) => {
    return collectedCards.filter(card => card.language === language);
  }, [collectedCards]);

  const getCardsByRarity = useCallback((rarity: 'common' | 'rare' | 'epic') => {
    return collectedCards.filter(card => card.rarity === rarity);
  }, [collectedCards]);

  const clearCollection = useCallback(() => {
    // Note: This only clears local state and localStorage
    // In a real app, you'd want to clear the user's collection in Supabase too
    setCollectedCards([]);
    setStats(defaultStats);
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