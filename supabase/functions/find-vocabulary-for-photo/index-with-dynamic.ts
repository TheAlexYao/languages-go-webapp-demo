// Enhanced version that can create new vocabulary cards dynamically

async function findOrCreateVocabularyMatches(
  keywords: string[], 
  targetLanguage: string = 'es'
): Promise<VocabularyCard[]> {
  try {
    // First, find existing matches
    const { data: existingCards, error } = await supabase
      .from('master_vocabulary')
      .select('*')
      .or(keywords.map(keyword => `word.ilike.%${keyword}%`).join(','));

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    const foundWords = new Set(
      (existingCards || []).map(card => card.word.toLowerCase())
    );
    
    // Find keywords that don't have cards yet
    const missingKeywords = keywords.filter(
      keyword => !foundWords.has(keyword.toLowerCase())
    );

    // If all keywords are found, return existing cards
    if (missingKeywords.length === 0) {
      return existingCards || [];
    }

    // Generate new cards for missing keywords
    console.log(`🆕 Creating cards for new words: ${missingKeywords.join(', ')}`);
    
    const newCards = await generateNewVocabularyCards(missingKeywords, targetLanguage);
    
    // Insert new cards into the database
    if (newCards.length > 0) {
      const { data: insertedCards, error: insertError } = await supabase
        .from('master_vocabulary')
        .insert(newCards.map(card => ({
          word: card.word,
          translation: card.translation,
          category: card.category,
          difficulty: card.difficulty,
          rarity: card.rarity,
          language_detected: targetLanguage,
          created_by_ai: true // Flag to indicate AI-generated
        })))
        .select('*');

      if (insertError) {
        console.error('Failed to insert new cards:', insertError);
        // Continue with existing cards even if insert fails
      } else {
        return [...(existingCards || []), ...(insertedCards || [])];
      }
    }

    return existingCards || [];
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
    return [];
  }

  const prompt = `For each of these English words, provide:
1. Translation to ${targetLanguage}
2. Category (animal, food, object, nature, building, person, etc.)
3. Difficulty (1=easy, 2=medium, 3=hard)
4. Rarity (common, rare, epic)

Words: ${keywords.join(', ')}

Return as JSON array with format:
[{"word": "cat", "translation": "gato", "category": "animal", "difficulty": 1, "rarity": "common"}]`;

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
            candidateCount: 1,
            responseMimeType: "application/json"
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
      return [];
    }

    // Parse the JSON response
    const cards = JSON.parse(jsonText);
    
    return cards.map(card => ({
      word: card.word,
      translation: card.translation,
      category: card.category || 'object',
      difficulty: card.difficulty || 1,
      rarity: card.rarity || 'common',
      base_image_url: '' // Will be generated later by sticker system
    }));
    
  } catch (error) {
    console.error('Failed to generate new cards:', error);
    return [];
  }
}