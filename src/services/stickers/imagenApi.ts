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

// Generate sticker using Gemini 2.0 Flash
export const generateStickerWithImagen = async (
  card: VocabularyCard
): Promise<StickerGenerationResult> => {
  try {
    // Generate sticker configuration
    const stickerConfig = generateStickerConfig(card);
    const apiRequest = configToApiRequest(stickerConfig);
    
    // Create a detailed prompt for Gemini
    const detailedPrompt = `Generate an image with these exact specifications:
${apiRequest.prompt}

Style requirements:
- Kawaii chibi art style
- Die-cut sticker appearance
- Thick black outline
- Flat colors, no gradients
- White background
- Cute facial expression
- Simple, rounded shapes

Avoid: ${apiRequest.negative_prompt}`;
    
    // Make API request to Gemini
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: detailedPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
          responseModalities: ["IMAGE", "TEXT"]
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    // Parse the JSON response
    const data = await response.json();
    
    // Check for generated image in the response
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts?.[0]) {
      throw new Error('No content in response');
    }
    
    const part = candidate.content.parts[0];
    let imageBlob: Blob;
    
    // Check if the part contains inline image data
    if (part.inlineData?.mimeType?.includes('image')) {
      // Image is in the response as base64
      const base64Data = part.inlineData.data;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBlob = new Blob([bytes], { type: part.inlineData.mimeType });
    } else if (part.text) {
      // If we got text instead of an image, throw an error
      console.error('Got text response instead of image:', part.text);
      throw new Error('Model returned text instead of image');
    } else {
      throw new Error('No image generated');
    }

    const stickerId = generateStickerId(card.word, card.language);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('stickers')
      .upload(`${stickerId}.png`, 
        imageBlob, 
        {
          contentType: 'image/png',
          cacheControl: '31536000', // 1 year cache
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('stickers')
      .getPublicUrl(`${stickerId}.png`);

    return {
      success: true,
      stickerUrl: publicUrl,
      stickerId
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