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

// Authentication functions
export const signInAnonymously = async () => {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
  return data;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
  return user;
};

// Core function: Find cards from photo
export const findCardsFromPhoto = async (
  imageBase64: string,
  location: { lat: number; lng: number }
): Promise<{ cards: VocabularyCard[]; pin: PhotoPin }> => {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('find-cards-for-photo', {
      body: {
        image_data: imageBase64,
        location: location
      }
    });

    if (error) {
      console.error('Error calling find-cards-for-photo function:', error);
      throw error;
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
      throw new Error('User not authenticated');
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
      throw new Error('User not authenticated');
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