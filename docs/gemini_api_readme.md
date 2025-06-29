# Gemini API Integration - Languages Go

This document explains how the Gemini API integration works in the Languages Go app for real-time photo analysis and vocabulary discovery.

## Overview

The app uses Google's Gemini 2.5 Flash model to analyze photos taken by users, identify objects in the images, and match those objects to vocabulary words in our database.

## Architecture

```
User Photo → Gemini API → Keywords → Database Lookup → Vocabulary Cards
```

### Flow Details

1. **Photo Capture**: User takes a photo using the camera interface
2. **Image Processing**: Photo is compressed and converted to base64
3. **Gemini Analysis**: Image sent to Gemini API with specific prompt
4. **Keyword Extraction**: Gemini returns comma-separated list of objects
5. **Database Query**: Keywords matched against `master_vocabulary` table
6. **Result Display**: Matching vocabulary cards shown to user

## Configuration

### Development Mode (Default)
- Uses mock data for fast development
- No API costs
- Instant responses
- Configurable in `src/services/config.ts`

```typescript
USE_REAL_GEMINI_API: false  // Mock mode
```

### Production Mode
- Uses real Gemini API
- Requires API key
- Real-time analysis
- ~$0.0025 per image

```typescript
USE_REAL_GEMINI_API: true   // Real API mode
```

## Files Structure

```
supabase/functions/find-vocabulary-for-photo/
├── index.ts                    # Edge Function implementation

src/services/
├── config.ts                   # Configuration management
├── supabase.ts                 # Service functions

src/components/Camera/
├── PhotoCapture.tsx            # Camera interface with enhanced states

docs/
├── gemini_integration_plan.md  # Detailed implementation plan
├── gemini_api_readme.md        # This file
```

## Key Features

### ✅ Implemented
- **Secure Authentication**: User auth required for API calls
- **Error Handling**: Comprehensive error messages for different failure modes
- **Mock/Real API Switching**: Easy configuration for development vs production
- **Image Compression**: Automatic photo optimization before API call
- **Location Tracking**: GPS coordinates saved with each photo
- **Database Integration**: Efficient vocabulary matching
- **Progress Indicators**: Multi-step loading states for better UX

### 🔧 Ready for Deployment
- **Edge Function**: Complete Supabase function ready to deploy
- **Environment Variables**: Secure API key management
- **Error Recovery**: Retry logic and timeout handling

## Usage

### For Development
1. Keep `USE_REAL_GEMINI_API: false` in config
2. Take photos to see mock vocabulary cards
3. Test all UI states and error conditions

### For Production
1. Get Gemini API key from Google AI Studio
2. Deploy Edge Function to Supabase
3. Set environment variable: `GEMINI_API_KEY`
4. Update config: `USE_REAL_GEMINI_API: true`
5. Test with real photos

## API Details

### Gemini Model
- **Model**: `gemini-2.5-flash`
- **Capability**: Multimodal (vision + text)
- **Input**: Base64 image + text prompt
- **Output**: Comma-separated keywords

### Prompt Strategy
```
"List all the prominent objects in this image as a simple, comma-separated list of keywords. 
Focus on concrete nouns that could be vocabulary words. 
For example: 'car, tree, house, dog, book, chair'
Only return the comma-separated list, nothing else."
```

### Database Query
```sql
SELECT * FROM master_vocabulary 
WHERE word ILIKE '%keyword1%' 
   OR word ILIKE '%keyword2%' 
   OR word ILIKE '%keyword3%'
```

## Error Handling

The system handles various error conditions gracefully:

- **Authentication Errors**: "Authentication required"
- **API Failures**: "Unable to analyze photo"
- **Network Issues**: "Connection error, please try again"
- **No Matches**: "No new words found, try another photo!"
- **Invalid Data**: "Error occurred, please try again"

## Performance

- **Response Time**: 2-5 seconds typical
- **Image Size**: Compressed to ~1MB before API call
- **Cost**: ~$0.0025 per image analysis
- **Timeout**: 30 seconds maximum

## Security

- **Authentication**: Required for all API calls
- **API Keys**: Stored as Supabase secrets
- **CORS**: Properly configured for web app
- **Rate Limiting**: Handled by Gemini API

## Monitoring

- **Debug Logging**: Enabled in development mode
- **API Response Logging**: Available for troubleshooting
- **Error Tracking**: Comprehensive error messages and logging

## Next Steps

1. **Deploy** the Edge Function to Supabase
2. **Configure** Gemini API key
3. **Test** with real photos
4. **Monitor** performance and costs
5. **Optimize** prompts based on results