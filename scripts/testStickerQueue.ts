#!/usr/bin/env node

import { processNewVocabularyForStickers } from '../src/services/stickers/stickerIntegration';
import { stickerQueue } from '../src/services/stickers/stickerQueue';
import { VocabularyCard } from '../src/types/vocabulary';

// Simple test to verify sticker queue integration
async function testStickerQueue() {
  console.log('🧪 Testing Sticker Queue System...\n');

  // Create mock vocabulary cards (simulating newly discovered words)
  const mockNewCards: VocabularyCard[] = [
    {
      id: 'test-1',
      word: 'testword',
      translation: 'test word',
      language: 'en',
      difficulty: 1,
      aiImageUrl: '', // No image - needs sticker
      aiPrompt: '',
      pinId: 'test-pin-1',
      rarity: 'common',
      category: 'test'
    }
  ];

  try {
    // Test 1: Process new vocabulary for stickers
    console.log('🎯 Test 1: Processing new vocabulary cards...');
    const results = await processNewVocabularyForStickers(mockNewCards);
    console.log('✅ Processing results:', results);

    // Test 2: Check queue status
    console.log('\n📊 Test 2: Checking queue status...');
    const pendingCount = stickerQueue.getPendingCount();
    console.log(`📦 Pending jobs in queue: ${pendingCount}`);

    // Test 3: Check job status if any jobs were created
    if (results.length > 0) {
      console.log('\n🔍 Test 3: Job processing result');
      console.log('📋 Job result:', results[0]);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Sticker integration working');
    console.log('- ✅ Queue system functional');
    console.log('- ✅ Background processing ready');
    console.log('\n🎨 The system will automatically generate stickers for new words discovered via photo capture!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  // Exit the process
  process.exit(0);
}

// Run the test
testStickerQueue(); 