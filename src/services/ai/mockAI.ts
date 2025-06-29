import { VocabularyCard } from '../../types/vocabulary';

// Mock AI responses for demo purposes
const mockVocabulary = [
  { word: 'árbol', translation: 'tree', category: 'nature', language: 'Spanish' },
  { word: 'perro', translation: 'dog', category: 'animals', language: 'Spanish' },
  { word: 'casa', translation: 'house', category: 'buildings', language: 'Spanish' },
  { word: 'coche', translation: 'car', category: 'transport', language: 'Spanish' },
  { word: 'gato', translation: 'cat', category: 'animals', language: 'Spanish' },
  { word: 'libro', translation: 'book', category: 'objects', language: 'Spanish' },
  { word: 'flor', translation: 'flower', category: 'nature', language: 'Spanish' },
  { word: 'mesa', translation: 'table', category: 'furniture', language: 'Spanish' },
  { word: 'agua', translation: 'water', category: 'nature', language: 'Spanish' },
  { word: 'sol', translation: 'sun', category: 'nature', language: 'Spanish' },
  { word: 'chien', translation: 'dog', category: 'animals', language: 'French' },
  { word: 'maison', translation: 'house', category: 'buildings', language: 'French' },
  { word: 'voiture', translation: 'car', category: 'transport', language: 'French' },
  { word: 'chat', translation: 'cat', category: 'animals', language: 'French' },
  { word: 'livre', translation: 'book', category: 'objects', language: 'French' },
  { word: 'Hund', translation: 'dog', category: 'animals', language: 'German' },
  { word: 'Haus', translation: 'house', category: 'buildings', language: 'German' },
  { word: 'Auto', translation: 'car', category: 'transport', language: 'German' },
  { word: 'Katze', translation: 'cat', category: 'animals', language: 'German' },
  { word: 'Buch', translation: 'book', category: 'objects', language: 'German' }
];

const categoryEmojis: Record<string, string> = {
  nature: '🌳',
  animals: '🐕',
  buildings: '🏠',
  transport: '🚗',
  objects: '📚',
  furniture: '🪑',
  food: '🍎'
};

const rarityWeights = {
  common: 0.7,
  rare: 0.25,
  epic: 0.05
};

const getRarity = (): 'common' | 'rare' | 'epic' => {
  const rand = Math.random();
  if (rand < rarityWeights.epic) return 'epic';
  if (rand < rarityWeights.epic + rarityWeights.rare) return 'rare';
  return 'common';
};

const getDifficulty = (rarity: string): 1 | 2 | 3 => {
  switch (rarity) {
    case 'epic': return 3;
    case 'rare': return 2;
    default: return 1;
  }
};

export const analyzePhotoMock = async (imageBase64: string): Promise<string[]> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
  
  // Return 1-3 random vocabulary items
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...mockVocabulary].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(item => 
    `${item.word}|${item.translation}|${item.category}|${item.language}`
  );
};

export const generateCardImageMock = async (word: string, category: string): Promise<string> => {
  // Simulate image generation delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
  
  // Return emoji as fallback for demo
  const emoji = categoryEmojis[category] || '📝';
  
  // Create a simple colored background with emoji
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
    const colors = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140']
    ];
    const colorPair = colors[Math.floor(Math.random() * colors.length)];
    gradient.addColorStop(0, colorPair[0]);
    gradient.addColorStop(1, colorPair[1]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 200);
    
    // Add emoji
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 100, 100);
  }
  
  return canvas.toDataURL();
};

export const createVocabularyCardMock = (
  word: string,
  translation: string,
  category: string,
  language: string,
  pinId: string,
  imageUrl: string
): VocabularyCard => {
  const rarity = getRarity();
  const difficulty = getDifficulty(rarity);
  
  return {
    id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    word,
    translation,
    language,
    difficulty,
    aiImageUrl: imageUrl,
    aiPrompt: `Simple flat icon of ${word}, minimalist style, ${category} theme`,
    pinId,
    rarity,
    category,
    pronunciation: `/${word}/`, // Simplified pronunciation
    exampleSentence: `This is a ${word}.` // Simplified example
  };
};