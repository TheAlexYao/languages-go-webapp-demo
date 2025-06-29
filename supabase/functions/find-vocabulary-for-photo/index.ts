import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Types
interface RequestBody {
  image_data: string; // base64 encoded image
  location: {
    latitude: number;
    longitude: number;
  };
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

async function findVocabularyMatches(keywords: string[]): Promise<VocabularyCard[]> {
  try {
    // Use ILIKE for case-insensitive matching against any of the keywords
    const { data, error } = await supabase
      .from('master_vocabulary')
      .select('*')
      .or(keywords.map(keyword => `word.ilike.%${keyword}%`).join(','));

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to query vocabulary: ${error.message}`);
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

    // Step 2: Find matching vocabulary cards
    console.log('🔍 Finding vocabulary matches...');
    const vocabularyCards = await findVocabularyMatches(keywords);
    console.log(`📚 Vocabulary matches found: ${vocabularyCards.length}`);

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