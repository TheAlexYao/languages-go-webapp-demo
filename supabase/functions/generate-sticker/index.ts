// deno-lint-ignore-file
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Types
interface RequestBody {
  word: string;
  language: string;
  category: string;
  card_id?: string;
}

interface StickerResponse {
  success: boolean;
  sticker_url?: string;
  error?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Gemini API configuration
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent';

// Generate kawaii chibi sticker
async function generateSticker(word: string, language: string, category: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `Create a kawaii chibi-style sticker illustration of "${word}". 
Style: Extremely cute, rounded features, big eyes, soft pastel colors, minimalist design.
Character: Make it look like an adorable cartoon character version of ${word}.
Background: Simple solid color or minimal pattern.
Art style: Japanese kawaii aesthetic, chibi proportions, very cute and friendly.
Colors: Soft pastels, not too bright or saturated.
No text or words in the image.`;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      responseMimeType: "image/png"
    }
  };

  console.log(`🎨 Generating sticker for "${word}"...`);

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
    throw new Error('No image data in Gemini response');
  }

  return data.candidates[0].content.parts[0].inlineData.data;
}

// Upload sticker to Supabase storage
async function uploadSticker(imageData: string, filename: string): Promise<string> {
  // Convert base64 to blob
  const byteCharacters = atob(imageData);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);

  console.log(`📤 Uploading sticker: ${filename} (${Math.round(byteArray.length / 1024)}KB)`);

  const { data, error } = await supabase.storage
    .from('stickers')
    .upload(filename, byteArray, {
      contentType: 'image/png',
      cacheControl: '31536000', // 1 year cache
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from('stickers')
    .getPublicUrl(filename);

  return publicData.publicUrl;
}

// Generate unique filename
function generateFilename(word: string, language: string): string {
  const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString(36);
  return `${language}_${cleanWord}_${timestamp}.png`;
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS pre-flight requests
  if (req.method === 'OPTIONS') {
    const reqHeaders = req.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization';
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': reqHeaders,
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body: RequestBody = await req.json();
    const { word, language, category, card_id } = body;

    if (!word || !language || !category) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🚀 Generating sticker for: ${word} (${language})`);

    // Generate sticker image
    const imageData = await generateSticker(word, language, category);
    
    // Upload to storage
    const filename = generateFilename(word, language);
    const stickerUrl = await uploadSticker(imageData, filename);
    
    console.log(`✅ Sticker generated: ${stickerUrl}`);

    // Update vocabulary card if card_id provided
    if (card_id) {
      const { error: updateError } = await supabase
        .from('vocabulary_cards')
        .update({ ai_image_url: stickerUrl })
        .eq('id', card_id);

      if (updateError) {
        console.warn(`⚠️ Failed to update card ${card_id}:`, updateError);
      } else {
        console.log(`📝 Updated card ${card_id} with sticker URL`);
      }
    }

    const response: StickerResponse = {
      success: true,
      sticker_url: stickerUrl
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      }
    );

  } catch (error) {
    console.error('❌ Sticker generation error:', error);
    
    const response: StickerResponse = {
      success: false,
      error: error.message
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      }
    );
  }
}); 