import { createClient } from '@supabase/supabase-js';
import { VocabularyCard, PhotoPin } from '../types/vocabulary';

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
  location: { lat: number; lng: number }
): Promise<{ cards: VocabularyCard[]; pin: PhotoPin }> => {
  try {
    // Get current user
    const user = await getCurrentUser();
    
    // Generate a unique pin ID
    const pinId = `pin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (!user) {
      // Demo mode: Return mock data for testing
      console.log('🎭 Demo mode: Returning mock cards for photo analysis');
      
      // Save photo locally for demo mode
      const savedPhotoUrl = await savePhotoLocally(imageBase64, pinId);
      
      const mockCards: VocabularyCard[] = [
        {
          id: 'demo-1',
          word: 'tree',
          translation: 'árbol',
          language: 'Spanish',
          difficulty: 1 as const,
          aiImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
          aiPrompt: 'A beautiful tree in a park',
          pinId: pinId,
          rarity: 'common' as const,
          category: 'nature'
        },
        {
          id: 'demo-2',
          word: 'flower',
          translation: 'flor',
          language: 'Spanish',
          difficulty: 1 as const,
          aiImageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
          aiPrompt: 'A colorful flower in bloom',
          pinId: pinId,
          rarity: 'rare' as const,
          category: 'nature'
        }
      ];

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

      return { cards: mockCards, pin: mockPin };
    }

    // Save photo locally even in authenticated mode as backup
    const savedPhotoUrl = await savePhotoLocally(imageBase64, pinId);

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('find-cards-for-photo', {
      body: {
        image_data: imageBase64,
        location: location,
        pin_id: pinId // Pass the pin ID to the function
      }
    });

    if (error) {
      console.error('Error calling find-cards-for-photo function:', error);
      throw error;
    }

    // Ensure the returned pin has a proper photo URL
    if (data && data.pin) {
      data.pin.photoUrl = data.pin.photoUrl || savedPhotoUrl;
    }

    return data;
  } catch (error) {
    console.error('Error in findCardsFromPhoto:', error);
    throw error;
  }
};

// Fetch user's collected cards
export const getUserCollectedCards = async (): Promise<VocabularyCard[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Demo mode: Return mock collected cards
      console.log('🎭 Demo mode: Returning mock collected cards');
      return [
        {
          id: 'demo-collected-1',
          word: 'cat',
          translation: 'gato',
          language: 'Spanish',
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
          word: 'book',
          translation: 'libro',
          language: 'Spanish',
          difficulty: 2 as const,
          aiImageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
          aiPrompt: 'An open book with pages fluttering',
          pinId: 'demo-pin-collected-2',
          rarity: 'rare' as const,
          category: 'objects',
          collectedAt: new Date(Date.now() - 172800000) // 2 days ago
        }
      ];
    }

    const { data, error } = await supabase
      .from('user_collections')
      .select(`
        card_id,
        collected_at,
        master_vocabulary (
          id,
          word,
          translation,
          language,
          base_image_url,
          rarity,
          difficulty,
          category
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching collected cards:', error);
      throw error;
    }

    // Transform the data to match our VocabularyCard type
    return data.map((row: any) => ({
      id: row.master_vocabulary.id,
      word: row.master_vocabulary.word,
      translation: row.master_vocabulary.translation,
      language: row.master_vocabulary.language,
      difficulty: row.master_vocabulary.difficulty,
      aiImageUrl: row.master_vocabulary.base_image_url,
      aiPrompt: '', // Not stored in master_vocabulary for now
      pinId: '', // Not relevant for collected cards
      collectedAt: new Date(row.collected_at),
      rarity: row.master_vocabulary.rarity,
      category: row.master_vocabulary.category
    }));
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

    const { error } = await supabase
      .from('user_collections')
      .insert({
        user_id: user.id,
        card_id: card.id,
        collected_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error collecting card:', error);
      throw error;
    }
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