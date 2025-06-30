#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDynamicCardGeneration() {
  console.log('🧪 Testing dynamic card generation...\n');

  // Test with keywords that likely don't exist in the database
  const testKeywords = ['laptop', 'keyboard', 'monitor', 'headphones', 'microphone'];
  
  console.log('📝 Test keywords:', testKeywords.join(', '));
  
  // Check which cards already exist
  console.log('\n🔍 Checking existing cards...');
  const { data: existingCards, error: queryError } = await supabase
    .from('master_vocabulary')
    .select('word, translation')
    .or(testKeywords.map(keyword => `word.ilike.%${keyword}%`).join(','));

  if (queryError) {
    console.error('Query error:', queryError);
    return;
  }

  const existingWords = new Set((existingCards || []).map(card => card.word.toLowerCase()));
  console.log('✅ Found existing cards:', existingCards?.map(c => c.word).join(', ') || 'none');
  
  const missingWords = testKeywords.filter(word => !existingWords.has(word.toLowerCase()));
  console.log('❌ Missing cards:', missingWords.join(', ') || 'none');

  if (missingWords.length === 0) {
    console.log('\n✅ All test words already exist in the database!');
    return;
  }

  // Call the edge function to trigger dynamic generation
  console.log('\n🚀 Calling edge function to generate missing cards...');
  
  const mockImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 pixel image
  
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/find-vocabulary-for-photo`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          image_data: mockImageData,
          location: { latitude: 40.7128, longitude: -74.0060 },
          target_language: 'es'
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Edge function error:', response.status, error);
      return;
    }

    const result = await response.json();
    console.log('\n📦 Edge function response:');
    console.log('- Keywords found:', result.keywords_found?.join(', '));
    console.log('- Total vocabulary cards:', result.vocabulary_cards?.length);
    
    // Check if new cards were created
    console.log('\n🔍 Checking for newly created cards...');
    const { data: newCards, error: newQueryError } = await supabase
      .from('master_vocabulary')
      .select('word, translation, created_by_ai')
      .or(missingWords.map(keyword => `word.ilike.%${keyword}%`).join(','))
      .eq('created_by_ai', true);

    if (newQueryError) {
      console.error('Query error:', newQueryError);
      return;
    }

    if (newCards && newCards.length > 0) {
      console.log('\n✨ Successfully created new cards:');
      newCards.forEach(card => {
        console.log(`  - ${card.word} → ${card.translation}`);
      });
    } else {
      console.log('\n⚠️ No new cards were created');
    }

  } catch (error) {
    console.error('Error calling edge function:', error);
  }
}

// Run the test
testDynamicCardGeneration().catch(console.error);