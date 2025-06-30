import { supabase } from '../supabase';
import { generateStickerConfig, configToApiRequest, generateStickerId } from './stickerGenerator';
import { VocabularyCard } from '../../types/vocabulary';

// Gemini API configuration for image generation
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface StickerGenerationResult {
  success: boolean;
  stickerUrl?: string;
  error?: string;
  stickerId?: string;
}

// Generate sticker using Supabase Edge Function
export const generateStickerWithImagen = async (
  card: VocabularyCard
): Promise<StickerGenerationResult> => {
  try {
    console.log(`🎨 Requesting sticker generation for "${card.word}" via edge function...`);

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('generate-sticker', {
      body: {
        word: card.word,
        language: card.language,
        category: card.category,
        card_id: card.id
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Sticker generation failed: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Unknown sticker generation error');
    }

    console.log(`✅ Sticker generated via edge function: ${data.sticker_url}`);
    
    return {
      success: true,
      stickerUrl: data.sticker_url,
      stickerId: data.sticker_url.split('/').pop()?.replace('.png', '') || ''
    };

  } catch (error) {
    console.error('Error generating sticker:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};


// Batch generate stickers for multiple cards
export const batchGenerateStickers = async (
  cards: VocabularyCard[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, StickerGenerationResult>> => {
  const results = new Map<string, StickerGenerationResult>();
  const total = cards.length;
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    
    // Skip if card already has a sticker
    if (card.aiImageUrl && card.aiImageUrl.includes('stickers')) {
      results.set(card.id, {
        success: true,
        stickerUrl: card.aiImageUrl
      });
      continue;
    }
    
    // Generate sticker
    const result = await generateStickerWithImagen(card);
    results.set(card.id, result);
    
    // Update progress
    if (onProgress) {
      onProgress(i + 1, total);
    }
    
    // Add delay to respect rate limits (adjust as needed)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
};

// Update vocabulary card with sticker URL
export const updateCardWithSticker = async (
  cardId: string,
  stickerUrl: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('vocabulary_cards')
      .update({ 
        ai_image_url: stickerUrl
      })
      .eq('id', cardId);

    if (error) {
      console.error('Error updating card with sticker:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating card:', error);
    return false;
  }
};