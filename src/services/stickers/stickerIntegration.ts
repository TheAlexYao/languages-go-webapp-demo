import { VocabularyCard } from '../../types/vocabulary';
import { stickerQueue } from './stickerQueue';
import { supabase } from '../supabase';

// Process newly discovered vocabulary cards and queue them for sticker generation
export const processNewVocabularyForStickers = async (cards: VocabularyCard[]) => {
  console.log(`🎨 Processing ${cards.length} new vocabulary cards for sticker generation`);
  
  const results = [];
  
  for (const card of cards) {
    // Skip if card already has a sticker URL
    if (card.aiImageUrl && card.aiImageUrl.includes('stickers')) {
      console.log(`Card "${card.word}" already has a sticker, skipping`);
      continue;
    }
    
    try {
      // Queue for sticker generation
      const jobId = await stickerQueue.addToQueue(card);
      console.log(`✅ Queued "${card.word}" for sticker generation (job: ${jobId})`);
      
      results.push({
        cardId: card.id,
        word: card.word,
        jobId,
        status: 'queued'
      });
      
    } catch (error) {
      console.error(`❌ Failed to queue "${card.word}" for sticker generation:`, error);
      results.push({
        cardId: card.id,
        word: card.word,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
};

// Check if a vocabulary card needs a sticker
export const needsSticker = (card: VocabularyCard): boolean => {
  // No sticker URL at all
  if (!card.aiImageUrl) return true;
  
  // Has a URL but it's not a sticker (e.g., it's an Unsplash image)
  if (!card.aiImageUrl.includes('stickers') && !card.aiImageUrl.includes('supabase')) {
    return true;
  }
  
  return false;
};

// Get sticker URL for a card (with fallback)
export const getStickerUrl = (card: VocabularyCard): string => {
  console.log(`🎨 getStickerUrl DEBUG for "${card.word}":`, {
    word: card.word,
    translation: card.translation,
    aiImageUrl: card.aiImageUrl,
    cardId: card.id,
    hasImageUrl: !!card.aiImageUrl,
    urlLength: card.aiImageUrl?.length || 0,
    containsStickers: card.aiImageUrl?.includes('stickers') || false,
    containsSupabase: card.aiImageUrl?.includes('supabase') || false
  });
  
  // If card has any valid image URL, use it
  if (card.aiImageUrl && card.aiImageUrl.length > 0) {
    console.log(`✅ Using stored image URL for "${card.word}": ${card.aiImageUrl}`);
    return card.aiImageUrl;
  }
  
  // Generate a placeholder sticker URL based on the word
  console.log(`📝 No sticker URL found for "${card.word}", using placeholder`);
  return generatePlaceholderSticker(card);
};

// Generate a placeholder sticker while the real one is being generated
const generatePlaceholderSticker = (card: VocabularyCard): string => {
  // Use the first letter of the English translation for better recognition
  const firstLetter = card.translation.charAt(0).toUpperCase();
  const bgColor = getCategoryColor(card.category);
  
  // Create an SVG data URL for the placeholder
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${bgColor}" rx="20"/>
      <text x="100" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold" text-anchor="middle" fill="white">${firstLetter}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Get color based on category
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    animal: '#FF9B9B',
    food: '#FFDAB9',
    nature: '#90EE90',
    object: '#B0C4DE',
    building: '#D3D3D3',
    person: '#FDBCB4'
  };
  
  return colors[category.toLowerCase()] || '#E0E0E0';
};

// Monitor sticker generation progress
export const monitorStickerGeneration = async (
  jobIds: string[],
  onProgress?: (jobId: string, status: string, stickerUrl?: string) => void
): Promise<void> => {
  const pendingJobs = new Set(jobIds);
  
  while (pendingJobs.size > 0) {
    for (const jobId of pendingJobs) {
      const status = await stickerQueue.getJobStatus(jobId);
      
      if (!status) continue;
      
      if (status.status === 'completed' || status.status === 'failed') {
        pendingJobs.delete(jobId);
        
        if (onProgress) {
          onProgress(jobId, status.status, status.stickerUrl);
        }
      }
    }
    
    // Wait before checking again
    if (pendingJobs.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

// Initialize sticker generation for existing vocabulary without stickers
export const initializeStickerGeneration = async () => {
  try {
    // Check if we should run initialization
    const lastCheck = localStorage.getItem('lastStickerCheck');
    const now = Date.now();
    
    // Only check once per hour
    if (lastCheck && now - parseInt(lastCheck) < 3600000) {
      return;
    }
    
    localStorage.setItem('lastStickerCheck', now.toString());
    
    // Get vocabulary cards without stickers
    const { data: cards, error } = await supabase
      .from('vocabulary_cards')
      .select('*')
      .or('ai_image_url.is.null,ai_image_url.eq.')
      .limit(10); // Process 10 at a time
    
    if (error || !cards || cards.length === 0) {
      return;
    }
    
    console.log(`🎨 Found ${cards.length} vocabulary cards without stickers`);
    
    // Convert and queue them
    const vocabularyCards: VocabularyCard[] = cards.map(card => ({
      id: card.id,
      word: card.word,
      translation: card.translation || '',
      language: card.language_detected || 'en',
      difficulty: card.difficulty || 1,
      aiImageUrl: '',
      aiPrompt: '',
      pinId: card.wcache_id || '',
      rarity: 'common',
      category: card.category || 'object'
    }));
    
    await processNewVocabularyForStickers(vocabularyCards);
    
  } catch (error) {
    console.error('Error initializing sticker generation:', error);
  }
};