# Sticker Generation Setup Guide

## Prerequisites

1. **Gemini API Key**: Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Update .env file**: Replace `your_gemini_api_key_here` with your actual API key

## Step 1: Run Database Migration

Since we need database access, you have two options:

### Option A: Via Supabase Dashboard (Recommended)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/jdmzqrbabxnaarihvwfp/sql/new)
2. Copy the contents of `supabase/migrations/add_sticker_generation.sql`
3. Paste and run it in the SQL editor

### Option B: Via CLI (requires database password)
```bash
supabase db push
# Enter your database password when prompted
```

## Step 2: Test Sticker Generation

Let's create a simple test script first:

```bash
# Create a test file
cat > test-sticker.js << 'EOF'
import { generateStickerConfig } from './src/services/stickers/stickerGenerator.js';

const testCard = {
  id: 'test-1',
  word: 'cat',
  translation: 'gato',
  language: 'es',
  difficulty: 1,
  aiImageUrl: '',
  aiPrompt: '',
  pinId: 'test-pin',
  rarity: 'common',
  category: 'animal'
};

const config = generateStickerConfig(testCard);
console.log('Sticker config:', JSON.stringify(config, null, 2));
EOF

# Run it
node test-sticker.js
```

## Step 3: Run Batch Sticker Generation

Once the database migration is complete:

```bash
# Generate stickers for all vocabulary without them
npm run generate-stickers
```

## Step 4: Monitor Progress

The script will show:
- Number of cards found without stickers
- Progress for each batch
- Success/failure status for each card
- Final summary

## Troubleshooting

### "Imagen API is only accessible to billed users"
- Make sure your Google Cloud project has billing enabled
- Imagen 3 costs $0.03 per image

### Rate Limiting
- The script automatically adds delays between batches
- Default: 5 cards per batch, 2 second delay

### Missing Dependencies
```bash
npm install --save-dev tsx dotenv @types/node
```

## Testing in Development

You can test with mock data by setting in `src/services/config.ts`:
```typescript
USE_REAL_API: false // This will use mock data instead of calling Imagen
```

## Next Steps

After stickers are generated:
1. Check Supabase Storage bucket "stickers" for generated images
2. Vocabulary cards will automatically show stickers in the UI
3. New words discovered via photo capture will auto-queue for sticker generation