#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Correct Gemini API configuration for image generation
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent';

// Progress tracking
let processed = 0;
let successful = 0;
let failed = 0;

// Simplified vocabulary card interface for Node.js
interface VocabularyCard {
  id: string;
  word: string;
  category: string;
  language_detected: string;
  difficulty: number;
  rarity: string;
}

// Generate sticker using Gemini API
async function generateStickerWithGemini(card: VocabularyCard): Promise<{ success: boolean; stickerUrl?: string; error?: string }> {
  try {
    // Create category-specific prompt
    const prompt = createStickerPrompt(card);
    
    // Make API request to Gemini with correct format
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192
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
    const data = await response.json() as any;
    
    // Check for generated content in the response
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error('No content in response');
    }
    
    // Look for the image in the response parts
    let imageData: string | null = null;
    for (const part of candidate.content.parts) {
      if (part.inlineData?.mimeType?.includes('image')) {
        imageData = part.inlineData.data;
        break;
      }
    }

    if (!imageData) {
      // Log any text response for debugging
      const textParts = candidate.content.parts.filter((p: any) => p.text).map((p: any) => p.text);
      if (textParts.length > 0) {
        console.log('Got text response:', textParts.join(' '));
      }
      throw new Error('No image generated');
    }

    // Convert base64 to buffer
    const binaryData = Buffer.from(imageData, 'base64');
    
    const stickerId = generateStickerId(card.word, card.language_detected);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('stickers')
      .upload(`${stickerId}.png`, 
        binaryData, 
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
      stickerUrl: publicUrl
    };

  } catch (error) {
    console.error('Error generating sticker:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Create sticker prompt based on card
function createStickerPrompt(card: VocabularyCard): string {
  const word = card.word.toLowerCase();
  const category = card.category.toLowerCase();
  
  let specificTraits = '';
  
  // Add category-specific traits
  switch (category) {
    case 'animal':
      if (word.includes('cat')) specificTraits = 'round body, pointed ears, curled tail, whiskers';
      else if (word.includes('dog')) specificTraits = 'floppy ears, wagging tail, round snout, tongue out';
      else if (word.includes('bird')) specificTraits = 'small wings, tiny beak, round body, feathers';
      else specificTraits = 'cute animal features, round body, adorable face';
      break;
      
    case 'food':
      if (word.includes('pizza')) specificTraits = 'triangular slice, melted cheese, colorful toppings';
      else if (word.includes('ice cream')) specificTraits = 'waffle cone, colorful scoops, cherry on top';
      else if (word.includes('cake')) specificTraits = 'layered dessert, frosting, sprinkles, candles';
      else specificTraits = 'appetizing appearance, colorful, delicious looking';
      break;
      
    case 'nature':
      if (word.includes('tree')) specificTraits = 'round leafy crown, thick trunk, green leaves';
      else if (word.includes('flower')) specificTraits = 'colorful petals, green stem, pollen center';
      else if (word.includes('sun')) specificTraits = 'circular yellow shape, radiating rays, happy face';
      else specificTraits = 'natural organic shapes, vibrant colors';
      break;
      
    case 'technology':
    case 'electronics':
      if (word.includes('computer') || word.includes('laptop')) specificTraits = 'rectangular screen with keyboard, cute pixel face on screen';
      else if (word.includes('phone')) specificTraits = 'rectangular device with glowing screen, app icons';
      else if (word.includes('mouse')) specificTraits = 'oval shape with cord tail, two button eyes';
      else specificTraits = 'modern tech device, sleek design, friendly appearance';
      break;
      
    case 'building':
      if (word.includes('house')) specificTraits = 'triangular roof, square base, windows, door, chimney';
      else if (word.includes('tower')) specificTraits = 'tall cylindrical or rectangular shape, windows, pointed top';
      else specificTraits = 'architectural structure, windows, geometric shapes';
      break;
      
    default:
      specificTraits = 'cute kawaii style, rounded features, friendly appearance';
  }

  return `Create a kawaii chibi sticker of "${word}" with these specifications:

Subject: ${word}
Style: Kawaii chibi art style, die-cut sticker appearance
Features: ${specificTraits}
Colors: Soft pastel colors with thick black outline
Expression: Happy, cute facial expression with big sparkly eyes
Background: Pure white background
Format: Simple, clean design perfect for a sticker

Requirements:
- Thick black outline around entire design
- Flat colors, no gradients or shadows
- Cute kawaii facial expression
- Rounded, simplified shapes
- Sticker-like appearance with clean edges
- No text or watermarks

Generate an image of this kawaii chibi sticker.`;
}

// Generate unique sticker ID
function generateStickerId(word: string, language: string): string {
  const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString(36);
  return `${language}_${cleanWord}_${timestamp}`;
}

// Update card with sticker URL
async function updateCardWithSticker(cardId: string, stickerUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('vocabulary_cards')
      .update({ 
        ai_image_url: stickerUrl
      })
      .eq('id', cardId);

    return !error;
  } catch (error) {
    console.error('Error updating card:', error);
    return false;
  }
}

// Main function to generate stickers
async function generateStickersForAllWords() {
  console.log('🎨 Starting sticker generation process...\n');
  
  // Check if API key is configured
  if (!GEMINI_API_KEY) {
    console.error('❌ VITE_GEMINI_API_KEY not found in environment variables');
    console.log('Please add your Gemini API key to the .env file:');
    console.log('VITE_GEMINI_API_KEY=your_api_key_here');
    return;
  }
  
  try {
    // Get all vocabulary cards and filter for ones without proper stickers
    const { data: allCards, error } = await supabase
      .from('vocabulary_cards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching cards:', error);
      return;
    }
    
    if (!allCards || allCards.length === 0) {
      console.log('❌ No cards found in database!');
      return;
    }
    
    // Debug: Show sample URLs
    console.log('\n🔍 Sample card URLs:');
    allCards.slice(0, 5).forEach(card => {
      console.log(`  "${card.word}": ${card.ai_image_url || 'NULL'}`);
    });
    
    // Filter cards that need stickers (null, empty, or Unsplash URLs)
    const cards = allCards.filter(card => {
      const hasNoUrl = !card.ai_image_url || card.ai_image_url.trim() === '';
      const hasUnsplashUrl = card.ai_image_url && card.ai_image_url.includes('unsplash');
      
      // Debug logging for first few cards
      if (allCards.indexOf(card) < 5) {
        console.log(`  Debug "${card.word}": hasNoUrl=${hasNoUrl}, hasUnsplashUrl=${hasUnsplashUrl}, url="${card.ai_image_url}"`);
      }
      
      return hasNoUrl || hasUnsplashUrl;
    });
    
    console.log(`\n📊 Total cards in database: ${allCards.length}`);
    console.log(`🎯 Cards needing stickers: ${cards.length}`);
    
    if (cards.length === 0) {
      console.log('✅ All cards already have proper stickers!');
      return;
    }
    
    console.log(`📚 Found ${cards.length} cards without stickers\n`);
    
    // Process cards in batches
    const batchSize = 2; // Even smaller batches for better reliability
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(cards.length / batchSize)}`);
      
      // Process batch sequentially to avoid rate limits
      for (const card of batch) {
        await processCard(card);
      }
      
      // Rate limiting - wait 5 seconds between batches
      if (i + batchSize < cards.length) {
        console.log('⏳ Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 STICKER GENERATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total processed: ${processed}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success rate: ${Math.round((successful / processed) * 100)}%`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Process a single card
async function processCard(card: any) {
  processed++;
  
  try {
    console.log(`\n🎯 Processing: "${card.word}" (${card.language_detected || 'en'}) - ${card.category || 'general'}`);
    
    // Generate sticker
    console.log('  🎨 Generating sticker...');
    const result = await generateStickerWithGemini(card);
    
    if (result.success && result.stickerUrl) {
      // Update card in database
      console.log('  💾 Saving to database...');
      const updated = await updateCardWithSticker(card.id, result.stickerUrl);
      
      if (updated) {
        successful++;
        console.log(`  ✅ Success! Sticker URL: ${result.stickerUrl}`);
      } else {
        failed++;
        console.log('  ❌ Failed to update database');
      }
    } else {
      failed++;
      console.log(`  ❌ Failed to generate: ${result.error}`);
    }
    
    // Add delay between individual requests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    failed++;
    console.error(`  ❌ Error processing card: ${error}`);
  }
}

// Run the generator
generateStickersForAllWords()
  .then(() => {
    console.log('\n✨ Sticker generation complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });