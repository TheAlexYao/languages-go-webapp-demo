#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { generateStickerWithImagen, updateCardWithSticker } from '../src/services/stickers/imagenApi.js';
import { VocabularyCard } from '../src/types/vocabulary.js';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Progress tracking
let processed = 0;
let successful = 0;
let failed = 0;

// Main function to generate stickers
async function generateStickersForAllWords() {
  console.log('🎨 Starting sticker generation process...\n');
  
  try {
    // Get all vocabulary cards without stickers
    const { data: cards, error } = await supabase
      .from('vocabulary_cards')
      .select('*')
      .or('ai_image_url.is.null,ai_image_url.eq.')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching cards:', error);
      return;
    }
    
    if (!cards || cards.length === 0) {
      console.log('✅ All cards already have stickers!');
      return;
    }
    
    console.log(`📚 Found ${cards.length} cards without stickers\n`);
    
    // Process cards in batches
    const batchSize = 5;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(cards.length / batchSize)}`);
      
      // Process batch in parallel
      await Promise.all(batch.map(card => processCard(card)));
      
      // Rate limiting - wait 2 seconds between batches
      if (i + batchSize < cards.length) {
        console.log('⏳ Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 STICKER GENERATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total processed: ${processed}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Process a single card
async function processCard(card: any) {
  processed++;
  
  try {
    console.log(`\n🎯 Processing: "${card.word}" (${card.language_detected})`);
    
    // Convert to VocabularyCard type
    const vocabularyCard: VocabularyCard = {
      id: card.id,
      word: card.word,
      translation: card.translation || '',
      language: card.language_detected || 'en',
      difficulty: card.difficulty || 1,
      aiImageUrl: '',
      aiPrompt: '',
      pinId: card.wcache_id || '',
      rarity: determineRarity(card.difficulty),
      category: card.category || guessCategory(card.word)
    };
    
    // Generate sticker
    console.log('  🎨 Generating sticker...');
    const result = await generateStickerWithImagen(vocabularyCard);
    
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
    
  } catch (error) {
    failed++;
    console.error(`  ❌ Error processing card: ${error}`);
  }
}

// Helper function to determine rarity based on difficulty
function determineRarity(difficulty: number): 'common' | 'rare' | 'epic' {
  if (difficulty >= 3) return 'epic';
  if (difficulty >= 2) return 'rare';
  return 'common';
}

// Helper function to guess category from word
function guessCategory(word: string): string {
  const lowercaseWord = word.toLowerCase();
  
  // Animal keywords
  if (['cat', 'dog', 'bird', 'fish', 'animal', 'pet'].some(keyword => lowercaseWord.includes(keyword))) {
    return 'animal';
  }
  
  // Food keywords
  if (['food', 'eat', 'drink', 'fruit', 'vegetable', 'meal', 'dessert'].some(keyword => lowercaseWord.includes(keyword))) {
    return 'food';
  }
  
  // Nature keywords
  if (['tree', 'flower', 'plant', 'forest', 'mountain', 'river'].some(keyword => lowercaseWord.includes(keyword))) {
    return 'nature';
  }
  
  // Building keywords
  if (['house', 'building', 'tower', 'bridge', 'castle'].some(keyword => lowercaseWord.includes(keyword))) {
    return 'building';
  }
  
  // Default to object
  return 'object';
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎨 Sticker Generator for Languages Go

Usage: npm run generate-stickers [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be generated without actually doing it

This script generates kawaii chibi stickers for all vocabulary cards
that don't already have stickers in the database.
    `);
    process.exit(0);
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
}