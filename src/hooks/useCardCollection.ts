import { useState, useCallback, useEffect } from 'react';
import { VocabularyCard, CollectionStats, Achievement } from '../types/vocabulary';
import { getUserCollectedCards, collectCard as supabaseCollectCard } from '../services/supabase';

const STATS_KEY = 'languages-go-stats';
const DEMO_CARDS_KEY = 'languages-go-demo-cards';

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

  // Save demo cards to localStorage for persistence
  const saveDemoCards = useCallback((cards: VocabularyCard[]) => {
    try {
      localStorage.setItem(DEMO_CARDS_KEY, JSON.stringify(cards));
    } catch (error) {
      console.error('Failed to save demo cards:', error);
    }
  }, []);

  // Load demo cards from localStorage
  const loadDemoCards = useCallback((): VocabularyCard[] => {
    try {
      const saved = localStorage.getItem(DEMO_CARDS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load demo cards:', error);
      return [];
    }
  }, []);

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
      
      // Calculate streak - consecutive days with at least one card collected
      const calculateStreak = (cards: VocabularyCard[]): number => {
        if (cards.length === 0) return 0;
        
        // Group cards by date
        const cardsByDate = new Map<string, VocabularyCard[]>();
        cards.forEach(card => {
          if (card.collectedAt) {
            const dateKey = new Date(card.collectedAt).toDateString();
            if (!cardsByDate.has(dateKey)) {
              cardsByDate.set(dateKey, []);
            }
            cardsByDate.get(dateKey)!.push(card);
          }
        });
        
        // Sort dates in descending order (most recent first)
        const sortedDates = Array.from(cardsByDate.keys())
          .map(dateStr => new Date(dateStr))
          .sort((a, b) => b.getTime() - a.getTime());
        
        if (sortedDates.length === 0) return 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Check if user collected cards today or yesterday (to maintain streak)
        const mostRecentDate = sortedDates[0];
        mostRecentDate.setHours(0, 0, 0, 0);
        
        if (mostRecentDate.getTime() < yesterday.getTime()) {
          // No activity today or yesterday, streak is broken
          return 0;
        }
        
        // Count consecutive days
        let streak = 0;
        let currentDate = new Date(today);
        
        for (let i = 0; i < sortedDates.length; i++) {
          const checkDate = new Date(sortedDates[i]);
          checkDate.setHours(0, 0, 0, 0);
          currentDate.setHours(0, 0, 0, 0);
          
          if (checkDate.getTime() === currentDate.getTime()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else if (checkDate.getTime() < currentDate.getTime()) {
            // Gap in streak, stop counting
            break;
          }
        }
        
        return streak;
      };
      
      const newStreak = calculateStreak(cards);
      
      const newStats: CollectionStats = {
        ...currentStats,
        totalCards: cards.length,
        uniqueWords,
        languages,
        xp: totalXp,
        level: newLevel,
        streak: newStreak
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

  // Load data from Supabase and localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        let cards: VocabularyCard[] = [];
        
        if (isAuthenticated) {
          // Load collected cards from Supabase for authenticated users
          console.log('📚 Loading collected cards from Supabase...');
          cards = await getUserCollectedCards();
        } else {
          // Load demo cards from localStorage for unauthenticated users
          console.log('🎭 Loading demo cards from localStorage...');
          cards = loadDemoCards();
        }
        
        setCollectedCards(cards);
        
        // Load stats from localStorage
        const savedStats = localStorage.getItem(STATS_KEY);
        if (savedStats) {
          const parsedStats = JSON.parse(savedStats);
          setStats({ ...defaultStats, ...parsedStats });
        }
        
        // Recalculate stats based on current cards
        updateStatsFromCards(cards);
        
        console.log(`✅ Loaded ${cards.length} collected cards`);
        
      } catch (error) {
        console.error('Failed to load collection data:', error);
        // Fallback to empty collection on error
        setCollectedCards([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isAuthenticated, updateStatsFromCards, loadDemoCards]);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
  }, [stats, isLoading]);

  const collectCard = useCallback(async (card: VocabularyCard) => {
    try {
      const collectedCard = {
        ...card,
        collectedAt: new Date()
      };
      
      if (isAuthenticated) {
        // Save to Supabase for authenticated users
        console.log('💾 Saving card to Supabase:', card.word);
        await supabaseCollectCard(card);
      } else {
        // Save to localStorage for demo mode
        console.log('🎭 Saving card to demo collection:', card.word);
        const currentDemoCards = loadDemoCards();
        const updatedDemoCards = [collectedCard, ...currentDemoCards];
        saveDemoCards(updatedDemoCards);
      }
      
      // Update local state
      setCollectedCards(prev => {
        const newCards = [collectedCard, ...prev];
        
        // Update stats based on new collection
        updateStatsFromCards(newCards);
        
        return newCards;
      });
      
      console.log('✅ Card collected successfully:', card.word);
      
    } catch (error) {
      console.error('Failed to collect card:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [isAuthenticated, updateStatsFromCards, loadDemoCards, saveDemoCards]);

  const getCardsByLanguage = useCallback((language: string) => {
    return collectedCards.filter(card => card.language === language);
  }, [collectedCards]);

  const getCardsByRarity = useCallback((rarity: 'common' | 'rare' | 'epic') => {
    return collectedCards.filter(card => card.rarity === rarity);
  }, [collectedCards]);

  const clearCollection = useCallback(() => {
    console.log('🗑️ Clearing collection');
    setCollectedCards([]);
    setStats(defaultStats);
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(DEMO_CARDS_KEY);
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