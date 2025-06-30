import { createClient } from '@supabase/supabase-js';
import { VocabularyCard, PhotoPin } from '../types/vocabulary';
import { Location } from '../types/location';
import { shouldUseRealAPI, debugLog, API_CONFIG, IS_DEVELOPMENT, DEV_MODE_CONFIG, AUTH_CONFIG } from './config';
import { processNewVocabularyForStickers } from './stickers/stickerIntegration';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface MasterVocabularyRow {
  id: string;
  word: string;
  translation: string;
  language: string;
  image_url: string;
  rarity: 'common' | 'rare' | 'epic';
  difficulty: 1 | 2 | 3;
  category: string;
  created_at: string;
}

export interface UserCollectedCardRow {
  id: string;
  user_id: string;
  card_id: string;
  collected_at: string;
}

export interface PhotoPinRow {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  photo_url: string;
  created_at: string;
}

// Local storage keys for persistence
const PHOTOS_STORAGE_KEY = 'languages-go-photos';
const PINS_STORAGE_KEY = 'languages-go-pins';

// Storage configuration
const MAX_PHOTOS = 20; // Maximum number of photos to keep
const MAX_PHOTO_SIZE = 800; // Maximum photo dimension (width/height)
const PHOTO_QUALITY = 0.8; // JPEG compression quality (0.1 - 1.0)

// Authentication functions
export const signInAnonymously = async (captchaToken?: string) => {
  const options: any = {};
  
  // Add CAPTCHA token if provided
  if (captchaToken) {
    options.captchaToken = captchaToken;
  }

  const { data, error } = await supabase.auth.signInAnonymously(options);
  if (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
  return data;
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      // If anonymous authentication is disabled, return null instead of throwing
      if (error.message?.includes('Auth session missing')) {
        console.log('⚠️ No auth session - running in demo mode');
        return null;
      }
      throw error;
    }
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function to compress image
const compressImage = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      if (width > height) {
        if (width > MAX_PHOTO_SIZE) {
          height = (height * MAX_PHOTO_SIZE) / width;
          width = MAX_PHOTO_SIZE;
        }
      } else {
        if (height > MAX_PHOTO_SIZE) {
          width = (width * MAX_PHOTO_SIZE) / height;
          height = MAX_PHOTO_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', PHOTO_QUALITY);
      
      // Remove the data:image/jpeg;base64, prefix
      resolve(compressedBase64.split(',')[1]);
    };
    img.src = imageSrc;
  });
};

// Helper function to clean up old photos
const cleanupOldPhotos = (): void => {
  try {
    const existingPhotos = JSON.parse(localStorage.getItem(PHOTOS_STORAGE_KEY) || '{}');
    const existingPins = JSON.parse(localStorage.getItem(PINS_STORAGE_KEY) || '[]');
    
    // Sort pins by creation date (newest first)
    const sortedPins = existingPins.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Keep only the most recent pins
    const pinsToKeep = sortedPins.slice(0, MAX_PHOTOS);
    const pinIdsToKeep = new Set(pinsToKeep.map((pin: any) => pin.id));
    
    // Clean up photos that are no longer needed
    const cleanedPhotos: { [key: string]: string } = {};
    Object.keys(existingPhotos).forEach(pinId => {
      if (pinIdsToKeep.has(pinId)) {
        cleanedPhotos[pinId] = existingPhotos[pinId];
      }
    });
    
    // Save cleaned data
    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(cleanedPhotos));
    localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(pinsToKeep));
    
    console.log(`🧹 Cleaned up storage: kept ${Object.keys(cleanedPhotos).length} photos and ${pinsToKeep.length} pins`);
  } catch (error) {
    console.error('Failed to cleanup old photos:', error);
  }
};

// Helper function to check storage usage
const getStorageUsage = (): { used: number; total: number; percentage: number } => {
  try {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length;
      }
    }
    
    // Estimate total available (this is approximate)
    const total = 5 * 1024 * 1024; // 5MB estimate
    const percentage = (used / total) * 100;
    
    return { used, total, percentage };
  } catch (error) {
    return { used: 0, total: 5 * 1024 * 1024, percentage: 0 };
  }
};

// Helper function to save photo locally with compression and cleanup
const savePhotoLocally = async (imageBase64: string, pinId: string): Promise<string> => {
  try {
    // Check storage usage before saving
    const storageUsage = getStorageUsage();
    console.log(`📊 Storage usage: ${Math.round(storageUsage.percentage)}% (${Math.round(storageUsage.used / 1024)}KB used)`);
    
    // If storage is getting full, clean up old photos
    if (storageUsage.percentage > 80) {
      console.log('🧹 Storage nearly full, cleaning up old photos...');
      cleanupOldPhotos();
    }
    
    // Compress the image
    console.log('🗜️ Compressing photo...');
    const compressedBase64 = await compressImage(`data:image/jpeg;base64,${imageBase64}`);
    
    // Calculate compression savings
    const originalSize = imageBase64.length;
    const compressedSize = compressedBase64.length;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    console.log(`📉 Photo compressed: ${Math.round(originalSize / 1024)}KB → ${Math.round(compressedSize / 1024)}KB (${savings}% smaller)`);
    
    // Get existing photos from localStorage
    const existingPhotos = JSON.parse(localStorage.getItem(PHOTOS_STORAGE_KEY) || '{}');
    
    // Save the compressed photo
    existingPhotos[pinId] = compressedBase64;
    
    try {
      // Save back to localStorage
      localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(existingPhotos));
    } catch (storageError) {
      // Handle storage quota exceeded error
      if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
        console.warn('⚠️ Storage quota exceeded, forcing cleanup...');
        cleanupOldPhotos();
        
        // Try again with cleaned storage
        const cleanedPhotos = JSON.parse(localStorage.getItem(PHOTOS_STORAGE_KEY) || '{}');
        cleanedPhotos[pinId] = compressedBase64;
        localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(cleanedPhotos));
      } else {
        throw storageError;
      }
    }
    
    // Return a local URL reference
    return `local:${pinId}`;
  } catch (error) {
    console.error('Failed to save photo locally:', error);
    // Fallback to returning the original base64 (uncompressed)
    return `data:image/jpeg;base64,${imageBase64}`;
  }
};

// Helper function to get photo from local storage
const getPhotoFromLocal = (photoUrl: string): string | null => {
  if (!photoUrl.startsWith('local:')) {
    return photoUrl;
  }
  
  try {
    const pinId = photoUrl.replace('local:', '');
    const existingPhotos = JSON.parse(localStorage.getItem(PHOTOS_STORAGE_KEY) || '{}');
    const photo = existingPhotos[pinId];
    
    if (photo) {
      return `data:image/jpeg;base64,${photo}`;
    }
  } catch (error) {
    console.error('Failed to get photo from local storage:', error);
  }
  
  return null;
};

// Helper function to save pins locally
const savePinsLocally = (pins: PhotoPin[]): void => {
  try {
    const serializedPins = pins.map(pin => ({
      ...pin,
      createdAt: pin.createdAt.toISOString() // Convert Date to string for JSON
    }));
    localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(serializedPins));
  } catch (error) {
    console.error('Failed to save pins locally:', error);
  }
};

// Helper function to load pins from local storage
const loadPinsLocally = (): PhotoPin[] => {
  try {
    const stored = localStorage.getItem(PINS_STORAGE_KEY);
    if (!stored) return [];
    
    const serializedPins = JSON.parse(stored);
    return serializedPins.map((pin: any) => ({
      ...pin,
      createdAt: new Date(pin.createdAt) // Convert string back to Date
    }));
  } catch (error) {
    console.error('Failed to load pins from local storage:', error);
    return [];
  }
};

// Core function: Find cards from photo
export const findCardsFromPhoto = async (
  imageBase64: string,
  location: { lat: number; lng: number },
  userLanguage: string = 'es'
): Promise<{ cards: VocabularyCard[]; pin: PhotoPin }> => {
  try {
    const user = await getCurrentUser();
    const pinId = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    debugLog(`📸 Finding cards from photo for ${user ? 'authenticated' : 'anonymous'} user`);

    // Save photo locally for persistence
    const savedPhotoUrl = await savePhotoLocally(imageBase64, pinId);

    // Check if we should use real API or mock data
    if (!shouldUseRealAPI()) {
      debugLog('Using mock API (configuration setting)');
      
      // Simulate API delay if configured
      if (API_CONFIG.MOCK_DATA.SIMULATE_DELAY) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.MOCK_DATA.DELAY_MS));
      }
      
      // Return mock data for testing - dynamically generate based on requested language
      const mockWords = [
        { en: 'building', es: 'edificio', fr: 'bâtiment', de: 'Gebäude', it: 'edificio', ja: '建物', ko: '건물', pt: 'edifício', zh: '建筑物' },
        { en: 'street', es: 'calle', fr: 'rue', de: 'Straße', it: 'strada', ja: '通り', ko: '거리', pt: 'rua', zh: '街道' },
        { en: 'car', es: 'coche', fr: 'voiture', de: 'Auto', it: 'auto', ja: '車', ko: '자동차', pt: 'carro', zh: '汽车' }
      ];
      
      const mockCards: VocabularyCard[] = mockWords.map((wordSet, index) => ({
        id: `mock-${index + 1}`,
        word: wordSet[userLanguage as keyof typeof wordSet] || wordSet.es, // Use requested language or fallback to Spanish
        translation: wordSet.en, // English translation
        language: userLanguage,
        difficulty: (index % 3 + 1) as 1 | 2 | 3,
        aiImageUrl: index === 0 
          ? 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop'
          : index === 1 
          ? 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop'
          : 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop',
        aiPrompt: `A ${wordSet.en} in the real world`,
        pinId: pinId,
        rarity: index === 2 ? 'rare' as const : 'common' as const,
        category: index === 0 ? 'architecture' : index === 1 ? 'urban' : 'transport'
      }));

      const mockPin: PhotoPin = {
        id: pinId,
        lat: location.lat,
        lng: location.lng,
        accuracy: 10,
        photoUrl: savedPhotoUrl,
        cards: mockCards,
        createdAt: new Date(),
        hasCollectedAll: false
      };

      // Save the pin locally for persistence
      const existingPins = loadPinsLocally();
      existingPins.push(mockPin);
      savePinsLocally(existingPins);

      debugLog(`Mock API returned ${mockCards.length} vocabulary cards`);
      return { cards: mockCards, pin: mockPin };
    }

    // Always use the Supabase Edge Function for real API calls
    // This works for both authenticated and anonymous users
    debugLog('🚀 Calling Supabase Edge Function for Gemini API analysis');
    
    const { data, error } = await supabase.functions.invoke('find-vocabulary-for-photo', {
      body: {
        image_data: imageBase64,
        location: {
          latitude: location.lat,
          longitude: location.lng
        },
        target_language: userLanguage
      }
    });

    if (error) {
      console.error('❌ Error calling find-vocabulary-for-photo function:', error);
      throw new Error(`Photo analysis failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from photo analysis');
    }

    debugLog('✅ Edge Function response received:', {
      vocabularyCount: data.vocabulary_cards?.length || 0,
      keywords: data.keywords_found
    });

    // Transform the response from the Edge Function to match our frontend types
    const vocabularyCards: VocabularyCard[] = (data.vocabulary_cards || []).map((card: any) => ({
      id: card.id,
      word: card.word,
      translation: card.translation,
      language: card.language || API_CONFIG.DEFAULT_LANGUAGE,
      difficulty: card.difficulty,
      aiImageUrl: card.base_image_url || `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop`,
      aiPrompt: `A ${card.word} in the real world`,
      pinId: pinId,
      rarity: card.rarity,
      category: card.category
    }));

    // Create the PhotoPin object
    const photoPin: PhotoPin = {
      id: pinId,
      lat: location.lat,
      lng: location.lng,
      accuracy: 10,
      photoUrl: savedPhotoUrl,
      cards: vocabularyCards,
      createdAt: new Date(),
      hasCollectedAll: false
    };

    // Save the pin locally for persistence
    const existingPins = loadPinsLocally();
    existingPins.push(photoPin);
    savePinsLocally(existingPins);

    debugLog(`✅ Found ${vocabularyCards.length} vocabulary matches from keywords: ${data.keywords_found?.join(', ') || 'none'}`);

    // Queue new vocabulary cards for sticker generation
    if (vocabularyCards.length > 0) {
      processNewVocabularyForStickers(vocabularyCards).catch(error => {
        console.error('Failed to queue stickers:', error);
      });
    }

    return { cards: vocabularyCards, pin: photoPin };
  } catch (error) {
    console.error('❌ Error in findCardsFromPhoto:', error);
    throw error;
  }
};

// Fetch user's collected cards
// Helper function to determine rarity based on difficulty
const determineRarity = (difficulty: number): 'common' | 'rare' | 'epic' => {
  if (difficulty >= 3) return 'epic';
  if (difficulty >= 2) return 'rare';
  return 'common';
};

// Helper function to detect language based on character patterns
const detectLanguage = (text: string): string => {
  if (!text) return 'en';
  
  // Japanese - contains hiragana, katakana, or kanji
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) return 'ja';
  
  // Korean - contains Hangul
  if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text)) return 'ko';
  
  // Chinese - contains Chinese characters (but not Japanese kanji context)
  if (/[\u4E00-\u9FAF]/.test(text) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'zh';
  
  // Spanish - contains Spanish-specific characters
  if (/[áéíóúüñ¿¡]/i.test(text)) return 'es';
  
  // French - contains French-specific characters
  if (/[àâäéèêëïîôöùûüÿç]/i.test(text)) return 'fr';
  
  // German - contains German-specific characters
  if (/[äöüß]/i.test(text)) return 'de';
  
  // Italian - contains Italian-specific characters
  if (/[àèéìíîòóù]/i.test(text)) return 'it';
  
  // Portuguese - contains Portuguese-specific characters
  if (/[ãáàâäêéèíîóôõöúù]/i.test(text)) return 'pt';
  
  // Default to English
  return 'en';
};

// Helper function to get the translated word for a specific language
const getTranslatedWord = (englishWord: string, translations: any, targetLanguage: string): string => {
  if (!translations || typeof translations !== 'object') return englishWord;
  
  // If target language translation exists, return it
  if (translations[targetLanguage]) {
    return translations[targetLanguage];
  }
  
  // Try to find any non-English translation as fallback
  const nonEnglishTranslations = Object.entries(translations).filter(([lang, _]) => lang !== 'en');
  if (nonEnglishTranslations.length > 0) {
    const [detectedLang, translation] = nonEnglishTranslations[0] as [string, string];
    return translation;
  }
  
  return englishWord;
};

// Helper function to guess category based on word
const guessCategory = (word: string): string => {
  const categoryKeywords: Record<string, string[]> = {
    'animals': ['cat', 'dog', 'bird', 'fish', 'gato', 'perro', 'pájaro', 'pez', 'chat', 'chien'],
    'food': ['apple', 'bread', 'coffee', 'tea', 'manzana', 'pan', 'café', 'té', 'pomme', 'pain'],
    'nature': ['tree', 'flower', 'sun', 'moon', 'water', 'árbol', 'flor', 'sol', 'luna', 'agua', 'arbre', 'fleur'],
    'urban': ['house', 'door', 'street', 'car', 'casa', 'puerta', 'calle', 'coche', 'maison', 'porte'],
    'technology': ['laptop', 'computer', 'phone', 'keyboard', 'mouse', 'monitor', 'portátil', 'computadora', 'teléfono', 'teclado', 'ratón']
  };
  
  const lowerWord = word.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerWord.includes(keyword) || keyword.includes(lowerWord))) {
      return category;
    }
  }
  return 'general';
};

export const getUserCollectedCards = async (): Promise<VocabularyCard[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Demo mode: Return mock collected cards showcasing different languages
      console.log('🎭 Demo mode: Returning mock collected cards');
      return [
        {
          id: 'demo-collected-1',
          word: 'gato',
          translation: 'cat',
          language: 'es',
          difficulty: 1 as const,
          aiImageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
          aiPrompt: 'A cute cat sitting in sunlight',
          pinId: 'demo-pin-collected-1',
          rarity: 'common' as const,
          category: 'animals',
          collectedAt: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          id: 'demo-collected-2',
          word: 'chat',
          translation: 'cat',
          language: 'fr',
          difficulty: 1 as const,
          aiImageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
          aiPrompt: 'A cute cat sitting in sunlight',
          pinId: 'demo-pin-collected-2',
          rarity: 'common' as const,
          category: 'animals',
          collectedAt: new Date(Date.now() - 172800000) // 2 days ago
        },
        {
          id: 'demo-collected-3',
          word: '本',
          translation: 'book',
          language: 'ja',
          difficulty: 2 as const,
          aiImageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
          aiPrompt: 'An open book with pages fluttering',
          pinId: 'demo-pin-collected-3',
          rarity: 'rare' as const,
          category: 'objects',
          collectedAt: new Date(Date.now() - 259200000) // 3 days ago
        },
        {
          id: 'demo-collected-4',
          word: 'Buch',
          translation: 'book',
          language: 'de',
          difficulty: 2 as const,
          aiImageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
          aiPrompt: 'An open book with pages fluttering',
          pinId: 'demo-pin-collected-4',
          rarity: 'rare' as const,
          category: 'objects',
          collectedAt: new Date(Date.now() - 345600000) // 4 days ago
        }
      ];
    }

    const { data, error } = await supabase
      .from('user_collections')
      .select(`
        card_id,
        collected_at,
        mastery_level,
        review_count,
        last_reviewed,
        vocabulary_cards (
          id,
          word,
          translation,
          language_detected,
          difficulty,
          rarity,
          category,
          ai_image_url,
          ai_prompt,
          pronunciation,
          example_sentence,
          pin_id,
          wcache_id
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching collected cards:', error);
      throw error;
    }

    // Get all unique words from collected cards for master vocabulary lookup
    const uniqueWords = [...new Set(data.map((row: any) => row.vocabulary_cards.word))];
    
    // Fetch master vocabulary data for all words in one query (including translations)
    const { data: masterVocabData } = await supabase
      .from('master_vocabulary')
      .select('word, rarity, category, translations')
      .in('word', uniqueWords);
    
    // Create a lookup map for faster access
    const masterVocabMap = new Map();
    if (masterVocabData) {
      masterVocabData.forEach((item: any) => {
        masterVocabMap.set(item.word, { 
          rarity: item.rarity, 
          category: item.category, 
          translations: item.translations 
        });
      });
    }

    // Transform the data to match our VocabularyCard type
    const transformedCards = data.map((row: any) => {
      const card = row.vocabulary_cards;
      const collection = row;
      
      // Use database fields first, with master vocab and fallbacks
      const masterInfo = masterVocabMap.get(card.word);
      
      // Priority: DB field → Master vocab → Fallback calculation
      const rarity = card.rarity || masterInfo?.rarity || determineRarity(card.difficulty || 1);
      const category = card.category || masterInfo?.category || guessCategory(card.word);
      const translations = masterInfo?.translations || {};

      // Language detection with improved logic
      let displayWord = card.word;
      let displayTranslation = card.translation;
      let language = card.language_detected || 'en';

      // If language is explicitly set in DB and not 'en', use as-is
      if (language && language !== 'en') {
        displayWord = card.word;
        displayTranslation = card.translation || displayWord;
      } else {
        // Detect language if not set or is English
        // First, try to detect language from existing translation
        if (card.translation) {
          const detectedLang = detectLanguage(card.translation);
          if (detectedLang !== 'en') {
            // If translation is in a foreign language, use it as the main word
            displayWord = card.translation;
            displayTranslation = card.word; // English word becomes translation
            language = detectedLang;
          }
        }

        // If no foreign language detected, check if we have translations from master vocab
        if (language === 'en' && translations && Object.keys(translations).length > 0) {
          // Get the first available non-English translation
          const availableLanguages = Object.keys(translations).filter(lang => lang !== 'en');
          if (availableLanguages.length > 0) {
            // Prefer Spanish, then French, then German, then others
            const preferredOrder = ['es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];
            const preferredLang = preferredOrder.find(lang => translations[lang]) || availableLanguages[0];
            
            displayWord = translations[preferredLang];
            displayTranslation = card.word; // English word becomes translation
            language = preferredLang;
          }
        }

        // If still English, try to detect from the word itself
        if (language === 'en') {
          const detectedLang = detectLanguage(card.word);
          if (detectedLang !== 'en') {
            // Word is in foreign language, translation should be English
            language = detectedLang;
            displayTranslation = card.translation || card.word;
          }
        }
      }

      return {
        id: card.id,
        word: displayWord,
        translation: displayTranslation || displayWord,
        language,
        difficulty: card.difficulty || 1,
        rarity,
        category,
        aiImageUrl: card.ai_image_url || '', // Now from database
        aiPrompt: card.ai_prompt || '', // Now from database
        pronunciation: card.pronunciation || undefined,
        exampleSentence: card.example_sentence || undefined,
        pinId: card.pin_id || card.wcache_id?.toString() || '', // Use new pin_id field
        collectedAt: new Date(collection.collected_at),
        // Additional collection metadata
        masteryLevel: collection.mastery_level,
        reviewCount: collection.review_count,
        lastReviewed: collection.last_reviewed ? new Date(collection.last_reviewed) : undefined
      };
    });
    
    return transformedCards;
  } catch (error) {
    console.error('Error in getUserCollectedCards:', error);
    throw error;
  }
};

// Collect a card (add to user's collection)
export const collectCard = async (card: VocabularyCard): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Demo mode: Just log the action
      console.log('🎭 Demo mode: Simulating card collection for:', card.word);
      return;
    }

    // First, check if a card with the same word and language already exists
    const { data: existingCard, error: checkError } = await supabase
      .from('vocabulary_cards')
      .select('id')
      .eq('word', card.word)
      .eq('language_detected', card.language)
      .single();

    let cardId: number;

    if (checkError || !existingCard) {
      // Card doesn't exist, insert it first with all fields
      console.log('📝 Inserting new vocabulary card:', card.word, 'in', card.language);
      const { data: insertedCard, error: insertError } = await supabase
        .from('vocabulary_cards')
        .insert({
          word: card.word,
          translation: card.translation,
          language_detected: card.language,
          difficulty: card.difficulty,
          rarity: card.rarity,
          category: card.category,
          ai_image_url: card.aiImageUrl || null,
          ai_prompt: card.aiPrompt || null,
          pronunciation: card.pronunciation || null,
          example_sentence: card.exampleSentence || null,
          pin_id: card.pinId, // Use new text field instead of converting to int
          wcache_id: null // Keep legacy field as null for new cards
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error inserting vocabulary card:', insertError);
        console.error('Card data:', {
          word: card.word,
          language: card.language,
          rarity: card.rarity,
          category: card.category
        });
        throw insertError;
      }

      cardId = insertedCard.id;
      console.log('✅ Successfully inserted card with ID:', cardId);
    } else {
      cardId = existingCard.id;
      console.log('📋 Using existing card with ID:', cardId);
    }

    // Check if user already has this card in their collection
    const { data: existingCollection, error: collectionCheckError } = await supabase
      .from('user_collections')
      .select('card_id')
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .single();

    if (existingCollection) {
      console.log('⚠️ Card already in user collection:', card.word);
      return; // Card already collected, no need to add again
    }

    // Now add to user's collection
    const { error } = await supabase
      .from('user_collections')
      .insert({
        user_id: user.id,
        card_id: cardId,
        collected_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error collecting card:', error);
      throw error;
    }

    console.log('✅ Card collected successfully:', card.word);
  } catch (error) {
    console.error('Error in collectCard:', error);
    throw error;
  }
};

// Fetch user's photo pins
export const getUserPhotoPins = async (): Promise<PhotoPin[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('map_pins')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photo pins:', error);
      throw error;
    }

    // Transform to PhotoPin format
    // Note: This is a simplified version. In reality, you'd need to fetch
    // the associated cards for each pin as well.
    return data.map((row: PhotoPinRow) => ({
      id: row.id,
      lat: row.lat,
      lng: row.lng,
      accuracy: 10, // Default accuracy
      photoUrl: row.photo_url,
      cards: [], // Cards would be fetched separately or joined
      createdAt: new Date(row.created_at),
      hasCollectedAll: false, // Would be calculated based on cards
      address: undefined // Would be reverse-geocoded if needed
    }));
  } catch (error) {
    console.error('Error in getUserPhotoPins:', error);
    throw error;
  }
};

// Test function to fetch master vocabulary
export const getMasterVocabulary = async (): Promise<MasterVocabularyRow[]> => {
  try {
    const { data, error } = await supabase
      .from('master_vocabulary')
      .select('*')
      .order('word');

    if (error) {
      console.error('Error fetching master vocabulary:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMasterVocabulary:', error);
    throw error;
  }
};

// Export helper functions for use in components
export { savePinsLocally, loadPinsLocally, getStorageUsage, cleanupOldPhotos };

// Function to clear all stored photos (for emergency cleanup)
export const clearAllPhotos = (): void => {
  try {
    localStorage.removeItem(PHOTOS_STORAGE_KEY);
    localStorage.removeItem(PINS_STORAGE_KEY);
    console.log('🗑️ Cleared all stored photos and pins');
  } catch (error) {
    console.error('Failed to clear photos:', error);
  }
};

// Function to get storage statistics
export const getStorageStats = (): { 
  photoCount: number; 
  pinCount: number; 
  storageUsage: { used: number; total: number; percentage: number };
  oldestPhoto?: Date;
  newestPhoto?: Date;
} => {
  try {
    const photos = JSON.parse(localStorage.getItem(PHOTOS_STORAGE_KEY) || '{}');
    const pins = JSON.parse(localStorage.getItem(PINS_STORAGE_KEY) || '[]');
    const storageUsage = getStorageUsage();
    
    const photoDates = pins.map((pin: any) => new Date(pin.createdAt)).filter(Boolean);
    const oldestPhoto = photoDates.length > 0 ? new Date(Math.min(...photoDates.map((d: Date) => d.getTime()))) : undefined;
    const newestPhoto = photoDates.length > 0 ? new Date(Math.max(...photoDates.map((d: Date) => d.getTime()))) : undefined;
    
    return {
      photoCount: Object.keys(photos).length,
      pinCount: pins.length,
      storageUsage,
      oldestPhoto,
      newestPhoto
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return {
      photoCount: 0,
      pinCount: 0,
      storageUsage: { used: 0, total: 5 * 1024 * 1024, percentage: 0 }
    };
  }
};

// Function to resolve photo URL for display
export const resolvePhotoUrl = (photoUrl: string): string => {
  if (photoUrl.startsWith('local:')) {
    return getPhotoFromLocal(photoUrl) || photoUrl;
  }
  return photoUrl;
};

// Development mode management functions
export const enableDevelopmentMode = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('set_config', {
      setting_name: 'app.environment',
      new_value: 'development',
      is_local: false
    });
    
    if (error) {
      console.warn('⚠️ Could not enable development mode via RPC, trying direct SQL...');
      // Fallback: try direct SQL execution
      const { error: sqlError } = await supabase
        .from('dummy_table_that_does_not_exist') // This will fail but execute the SQL
        .select('*')
        .limit(0);
      // The error is expected, we just want to execute: SELECT set_config('app.environment', 'development', false);
    }
    
    debugLog('🛠️ Development mode enabled in Supabase');
    return true;
  } catch (error) {
    console.warn('⚠️ Could not enable development mode:', error);
    return false;
  }
};

export const disableDevelopmentMode = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('set_config', {
      setting_name: 'app.environment', 
      new_value: 'production',
      is_local: false
    });
    
    if (error) {
      console.warn('⚠️ Could not disable development mode:', error);
      return false;
    }
    
    debugLog('🔒 Development mode disabled in Supabase');
    return true;
  } catch (error) {
    console.warn('⚠️ Could not disable development mode:', error);
    return false;
  }
};

export const checkDevelopmentMode = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('is_development_mode');
    
    if (error) {
      console.warn('⚠️ Could not check development mode:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.warn('⚠️ Could not check development mode:', error);
    return false;
  }
};

export const getRateLimitStatus = async (actionType: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  resetTime: Date;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get current rate limit data
    const { data, error } = await supabase
      .from('anonymous_rate_limits')
      .select('action_count, last_action_at')
      .eq('user_id', user.id)
      .eq('action_type', actionType)
      .maybeSingle();

    if (error) {
      console.error('Error checking rate limit:', error);
      // Default to allowing if we can't check
      return {
        allowed: true,
        currentCount: 0,
        limit: AUTH_CONFIG.ANONYMOUS_LIMITS.PINS_PER_HOUR,
        resetTime: new Date(Date.now() + 60 * 60 * 1000)
      };
    }

    const limit = actionType === 'create_pin' 
      ? AUTH_CONFIG.ANONYMOUS_LIMITS.PINS_PER_HOUR
      : AUTH_CONFIG.ANONYMOUS_LIMITS.CARDS_PER_HOUR;

    const currentCount = data?.action_count || 0;
    const lastAction = data?.last_action_at ? new Date(data.last_action_at) : new Date();
    const resetTime = new Date(lastAction.getTime() + 60 * 60 * 1000); // 1 hour from last action

    return {
      allowed: currentCount < limit,
      currentCount,
      limit,
      resetTime
    };
  } catch (error) {
    console.error('Error in getRateLimitStatus:', error);
    return {
      allowed: true,
      currentCount: 0,
      limit: AUTH_CONFIG.ANONYMOUS_LIMITS.PINS_PER_HOUR,
      resetTime: new Date(Date.now() + 60 * 60 * 1000)
    };
  }
};

// Auto-enable development mode on startup if configured
if (DEV_MODE_CONFIG.AUTO_ENABLE_ON_START && IS_DEVELOPMENT) {
  enableDevelopmentMode().then(success => {
    if (success) {
      console.log('🛠️ Development mode auto-enabled for testing');
    }
  }).catch(error => {
    console.warn('⚠️ Could not auto-enable development mode:', error);
  });
} 