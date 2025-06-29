export interface VocabularyCard {
  id: string;
  word: string;
  translation: string;
  language: string;
  difficulty: 1 | 2 | 3;
  aiImageUrl: string;
  aiPrompt: string;
  pinId: string;
  collectedAt?: Date;
  rarity: 'common' | 'rare' | 'epic';
  category: string;
  pronunciation?: string;
  exampleSentence?: string;
}

export interface PhotoPin {
  id: string;
  lat: number;
  lng: number;
  accuracy: number;
  photoUrl: string;
  cards: VocabularyCard[];
  createdAt: Date;
  hasCollectedAll: boolean;
  address?: string;
  isProcessing?: boolean;
}

export interface CollectionStats {
  totalCards: number;
  uniqueWords: number;
  languages: string[];
  streak: number;
  level: number;
  xp: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}