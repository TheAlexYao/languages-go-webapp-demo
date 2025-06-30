import { VocabularyCard } from '../../types/vocabulary';
import { stickerQueue } from './stickerQueue';
import { supabase } from '../supabase';

// Process newly discovered vocabulary cards and queue them for BACKGROUND sticker generation
// This function runs asynchronously and doesn't block the photo capture flow
export const processNewVocabularyForStickers = async (cards: VocabularyCard[]) => {
  console.log(`🎨 Processing ${cards.length} new vocabulary cards for background sticker generation`);
  
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
  // Only use image URL if it's a proper sticker (from Supabase storage)
  if (card.aiImageUrl && 
      card.aiImageUrl.length > 0 && 
      (card.aiImageUrl.includes('stickers') || card.aiImageUrl.includes('supabase.co/storage'))) {
    return card.aiImageUrl;
  }
  
  // Generate a placeholder sticker URL based on the word
  return generatePlaceholderSticker(card);
};

// Helper: Robust Unicode-safe Base64 encoding using TextEncoder (avoids InvalidCharacterError)
const encodeSvgToBase64 = (svg: string): string => {
  try {
    // Browser environment: TextEncoder is widely supported (Edge 79+, Safari 14+, iOS 14+)
    const uint8 = new TextEncoder().encode(svg);
    let binary = '';
    uint8.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  } catch (error) {
    // Fallback for very old browsers – shouldn't happen in PWA targets but just in case
    // Using encodeURIComponent / unescape as secondary strategy
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – unescape is deprecated but still available for fallback
    return btoa(unescape(encodeURIComponent(svg)));
  }
};

// Generate a beautiful placeholder sticker while the real one is being generated
const generatePlaceholderSticker = (card: VocabularyCard): string => {
  // Use the first letter of the English translation for better recognition
  const firstLetter = card.translation.charAt(0).toUpperCase();
  const bgColor = getCategoryColor(card.category);
  const shadowColor = getCategoryShadowColor(card.category);
  
  // Create a beautiful SVG with gradient and shadow
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${shadowColor};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      <rect width="200" height="200" fill="url(#cardGradient)" rx="24" filter="url(#shadow)"/>
      <circle cx="100" cy="100" r="70" fill="rgba(255,255,255,0.15)" />
      <text x="100" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="700" text-anchor="middle" fill="white" filter="url(#shadow)">${firstLetter}</text>
      <text x="100" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" text-anchor="middle" fill="rgba(255,255,255,0.8)">${card.category.toUpperCase()}</text>
    </svg>
  `;
  
  // Unicode-safe Base64 encoding (handles any language character)
  return `data:image/svg+xml;base64,${encodeSvgToBase64(svg)}`;
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

// Get shadow color based on category
const getCategoryShadowColor = (category: string): string => {
  const shadowColors: Record<string, string> = {
    animal: '#E85A5A',
    food: '#E6B56A',
    nature: '#5DC85D',
    object: '#7A94C4',
    building: '#ABABAB',
    person: '#E88A7A'
  };
  
  return shadowColors[category.toLowerCase()] || '#BFBFBF';
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