import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Types
interface RequestBody {
  image_data: string; // base64 encoded image
  location: {
    latitude: number;
    longitude: number;
  };
  target_language?: string; // Optional target language (default: 'es')
}

interface VocabularyCard {
  id: string;
  word: string;
  translation: string;
  category: string;
  difficulty: string;
  rarity: string;
  base_image_url: string;
}

interface ApiResponse {
  vocabulary_cards: VocabularyCard[];
  pin_id: string;
  keywords_found: string[];
  total_matches: number;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get Gemini API key from secrets
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

async function analyzeImageWithGemini(imageData: string): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `List all the prominent objects in this image as a simple, comma-separated list of keywords. 
Focus on concrete nouns that could be vocabulary words. 
For example: 'car, tree, house, dog, book, chair'
Only return the comma-separated list, nothing else.`;

  const requestBody = {
    contents: [{
      parts: [
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: imageData
          }
        },
        {
          text: prompt
        }
      ]
    }]
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    const keywordsText = data.candidates[0].content.parts[0].text.trim();
    
    // Parse the comma-separated keywords
    const keywords = keywordsText
      .split(',')
      .map(keyword => keyword.trim().toLowerCase())
      .filter(keyword => keyword.length > 0);

    return keywords;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

async function findOrCreateVocabularyMatches(keywords: string[], targetLanguage: string = 'es'): Promise<VocabularyCard[]> {
  try {
    // First, find existing matches based on English word only (ignore target language)
    const { data: existingCards, error } = await supabase
      .from('master_vocabulary')
      .select('*')
      .or(keywords.map(keyword => `word.ilike.%${keyword}%`).join(','))
      .eq('language', 'en'); // Only look for English base words

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    // Transform existing cards to include proper translation for target language
    const transformedExistingCards = (existingCards || []).map(card => {
      // Get translation from JSONB translations field or fallback to translation column
      let cardTranslation = card.translation || '';
      
      if (card.translations && typeof card.translations === 'object') {
        cardTranslation = card.translations[targetLanguage] || card.translation || card.word;
      }
      
      return {
        ...card,
        language_detected: targetLanguage, // Set the target language for frontend
        translation: cardTranslation
      };
    });

    const foundWords = new Set(
      transformedExistingCards.map(card => card.word.toLowerCase())
    );
    
    // Find keywords that don't have cards yet
    const missingKeywords = keywords.filter(
      keyword => !foundWords.has(keyword.toLowerCase())
    );

    // If all keywords are found, return existing cards with proper translations
    if (missingKeywords.length === 0) {
      return transformedExistingCards;
    }

    // Generate new cards for missing keywords
    console.log(`🆕 Creating cards for new words: ${missingKeywords.join(', ')}`);
    
    const newCards = await generateNewVocabularyCards(missingKeywords, targetLanguage);
    
    // Insert new cards into the database (only once per English word)
    if (newCards.length > 0) {
      const { data: insertedCards, error: insertError } = await supabase
        .from('master_vocabulary')
        .insert(newCards.map(card => ({
          word: card.word,
          language: 'en', // Always store as English base word
          category: card.category,
          difficulty: parseInt(card.difficulty),
          rarity: card.rarity,
          translations: card.translations || {}, // Store all translations
          created_by_ai: true // Flag to indicate AI-generated
        })))
        .select('*');

      if (insertError) {
        console.error('Failed to insert new cards:', insertError);
        // Continue with existing cards even if insert fails
        return transformedExistingCards;
      } else {
        // Transform inserted cards to include proper translation for target language
        const transformedNewCards = (insertedCards || []).map(card => {
          let cardTranslation = card.word;
          
          if (card.translations && typeof card.translations === 'object') {
            cardTranslation = card.translations[targetLanguage] || card.word;
          }
          
          return {
            ...card,
            language_detected: targetLanguage, // Set the target language for frontend
            translation: cardTranslation
          };
        });
        
        // Combine existing and new cards
        return [...transformedExistingCards, ...transformedNewCards];
      }
    }

    return transformedExistingCards;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to query/create vocabulary: ${error.message}`);
  }
}

async function generateNewVocabularyCards(
  keywords: string[], 
  targetLanguage: string
): Promise<Partial<VocabularyCard>[]> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not available for generating new cards');
    return [];
  }

  // Get all supported languages for multi-language generation
  const supportedLanguages = ['es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];
  
  const prompt = `For each of these English words, provide:
1. Translations to ALL of these languages: Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt), Japanese (ja), Korean (ko), Chinese (zh)
2. Category (animal, food, object, nature, building, person, vehicle, clothing, technology, etc.)
3. Difficulty (1=easy common word, 2=medium, 3=hard/uncommon)
4. Rarity for game purposes (common, rare, epic)

Words: ${keywords.join(', ')}

Return ONLY a JSON array with this exact format, no other text:
[{
  "word": "cat",
  "translations": {
    "es": "gato",
    "fr": "chat",
    "de": "Katze",
    "it": "gatto",
    "pt": "gato",
    "ja": "猫",
    "ko": "고양이",
    "zh": "猫"
  },
  "category": "animal",
  "difficulty": "1",
  "rarity": "common"
}]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            candidateCount: 1
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!jsonText) {
      console.error('No response text from Gemini');
      return [];
    }

    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in response:', jsonText);
        return [];
      }

      const cards = JSON.parse(jsonMatch[0]);
      
      // Generate unique IDs for the cards and return with the requested language translation
      return cards.map(card => ({
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        word: card.word,
        translation: card.translations?.[targetLanguage] || card.translations?.es || '',
        translations: card.translations, // Store all translations for later use
        category: card.category || 'object',
        difficulty: String(card.difficulty || 1),
        rarity: card.rarity || 'common',
        base_image_url: '' // Will be generated later by sticker system
      }));
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError, jsonText);
      return [];
    }
    
  } catch (error) {
    console.error('Failed to generate new cards:', error);
    return [];
  }
}

async function createMapPin(
  userId: string, 
  location: { latitude: number; longitude: number },
  keywords: string[]
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('map_pins')
      .insert({
        created_by: userId,
        latitude: location.latitude,
        longitude: location.longitude,
        metadata: {
          keywords_found: keywords,
          analysis_timestamp: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create map pin: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Map pin creation error:', error);
    throw new Error(`Failed to create map pin: ${error.message}`);
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user from auth header (optional for anonymous users)
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && authData?.user) {
          user = authData.user;
          console.log(`✅ Authenticated user: ${user.id} (${user.is_anonymous ? 'anonymous' : 'registered'})`);
        }
      } catch (authError) {
        console.warn('⚠️ Auth verification failed, proceeding as anonymous:', authError);
      }
    }

    // If no user found, this is an unauthenticated request
    if (!user) {
      console.log('🔓 Processing request without authentication');
    }

    // Parse request body
    const body: RequestBody = await req.json();
    
    if (!body.image_data || !body.location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: image_data, location' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 1: Analyze image with Gemini API
    console.log('🔍 Analyzing image with Gemini API...');
    const keywords = await analyzeImageWithGemini(body.image_data);
    console.log('📝 Keywords found:', keywords);

    // Step 2: Find or create vocabulary cards
    const targetLanguage = body.target_language || 'es';
    console.log(`🔍 Finding/creating vocabulary for language: ${targetLanguage}...`);
    const vocabularyCards = await findOrCreateVocabularyMatches(keywords, targetLanguage);
    console.log(`📚 Total vocabulary cards: ${vocabularyCards.length}`);

    // Step 3: Create map pin (only if user is authenticated)
    let pinId = `temp_pin_${Date.now()}`;
    
    if (user) {
      try {
        console.log('📍 Creating map pin for authenticated user...');
        pinId = await createMapPin(user.id, body.location, keywords);
        console.log('✅ Map pin created:', pinId);
      } catch (pinError) {
        console.warn('⚠️ Failed to create map pin, continuing with temporary ID:', pinError);
        // Continue with temporary pin ID rather than failing
      }
    } else {
      console.log('📍 Skipping map pin creation for unauthenticated request');
    }

    // Step 4: Return response
    const response: ApiResponse = {
      vocabulary_cards: vocabularyCards,
      pin_id: pinId,
      keywords_found: keywords,
      total_matches: vocabularyCards.length
    };

    console.log(`✅ Returning ${vocabularyCards.length} vocabulary cards for keywords: ${keywords.join(', ')}`);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}); 