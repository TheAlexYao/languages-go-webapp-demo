# Gemini API Integration Implementation Plan

## Feature: Real-Time Photo Analysis with Gemini API

**Goal:** Replace the current mock AI service with a real backend that uses the Gemini API to analyze user photos, identify objects, and return matching vocabulary cards from the database.

**Date:** December 2024  
**Status:** 🔧 In Progress

---

## Phase 1: Backend Development (Supabase Edge Function)

### Task 1.1: Create Edge Function Structure ✅
- **Action:** Create a new Supabase Edge Function named `find-vocabulary-for-photo`
- **Location:** `supabase/functions/find-vocabulary-for-photo/index.ts`
- **Details:** Deno-based function that handles the core logic
- **Status:** ✅ Complete

### Task 1.2: Implement Secure Request Handling ✅
- **Action:** Set up the function to handle POST requests, validate auth token, parse request body
- **Inputs Expected:**
  - `image_data`: base64 encoded image string
  - `location`: `{ latitude: number, longitude: number }`
- **Security:** Automatic user authentication via Supabase auth context
- **Status:** ✅ Complete

### Task 1.3: Integrate with Gemini API ✅
- **Action:** Store Gemini API key as Supabase secret and call Gemini Pro Vision model
- **API Model:** `gemini-2.5-flash` (multimodal with vision capabilities)
- **Prompt Strategy:** 
  ```
  "List all the prominent objects in this image as a simple, comma-separated list of keywords. 
  Focus on concrete nouns that could be vocabulary words. 
  For example: 'car, tree, house, dog, book, chair'"
  ```
- **Expected Response:** Comma-separated string of keywords
- **Status:** ✅ Complete

### Task 1.4: Implement Database Logic ✅
- **Action:** Query `master_vocabulary` table with extracted keywords
- **Matching Strategy:** Use SQL `ILIKE` or `IN` clause to find vocabulary entries where the word matches any of the keywords
- **Pin Creation:** Create new record in `map_pins` table with:
  - User ID (from auth context)
  - Location coordinates
  - Timestamp
  - Associated photo metadata
- **Status:** ✅ Complete

### Task 1.5: Handle Responses and Errors ✅
- **Success Response:**
  ```json
  {
    "vocabulary_cards": [VocabularyCard[]],
    "pin_id": "uuid",
    "keywords_found": ["word1", "word2"],
    "total_matches": 3
  }
  ```
- **Error Handling:**
  - Gemini API failures
  - No vocabulary matches found
  - Database connection issues
  - Invalid image data
- **Status:** ✅ Complete

---

## Phase 2: Frontend Integration (React)

### Task 2.1: Create Supabase Service Function ✅
- **File:** `src/services/supabase.ts`
- **Function:** `findVocabularyForPhoto(imageData: string, location: LocationCoords)`
- **Return Type:** `Promise<VocabularyCard[]>`
- **Error Handling:** Proper try/catch with user-friendly error messages
- **Status:** ✅ Complete

### Task 2.2: Update PhotoCapture Component ✅
- **File:** `src/components/Camera/PhotoCapture.tsx`
- **Changes:**
  - Enhanced loading states: "Analyzing photo with AI..." → "Identifying objects..." → "Finding vocabulary matches..."
  - Better error handling with user-friendly messages
  - Configurable mock/real API switching
- **UI States:**
  - Loading: Show progress indicator with specific steps
  - Success: Pass cards to parent
  - No matches: "No new words found, try another photo!"
  - Error: Context-specific error messages
- **Status:** ✅ Complete

### Task 2.3: Implement Robust Error Handling ✅
- **Network Errors:** Offline/connection issues
- **API Errors:** Gemini API failures
- **Empty Results:** No vocabulary matches
- **Invalid Responses:** Malformed data from backend
- **User Feedback:** Context-specific error messages in processing overlay
- **Status:** ✅ Complete

### Task 2.4: Update App Component ✅
- **File:** `src/App.tsx`
- **Handler:** Existing `handleCardsGenerated` function already handles new cards
- **State Updates:**
  - Adds new cards to `vocabularyCards` state
  - Updates user stats (photo count, card count)
  - Triggers `CardModal` to display new discoveries
- **Status:** ✅ Complete (already implemented)

---

## Configuration System ✅

### Task 2.5: Create Configuration Management ✅
- **File:** `src/services/config.ts`
- **Features:**
  - Easy switching between mock and real Gemini API
  - Environment-based configuration
  - Debug logging system
  - Feature flags for development
  - Configurable delays and timeouts
- **Usage:** Set `USE_REAL_GEMINI_API` to `true` to enable real API calls
- **Status:** ✅ Complete

---

## Phase 3: Verification & Polish

### Task 3.1: Development with Mocks (Primary Method)
- **Current Setup:** Continue using `src/services/ai/mockAI.ts` for development
- **Benefits:**
  - Instant feedback during development
  - Test all UI states (loading, success, empty, errors)
  - No API costs during frequent testing
- **Status:** ✅ Already in place

### Task 3.2: Manual End-to-End Verification
- **Process:**
  1. Temporarily switch to real Gemini API
  2. Test with variety of photos (indoor, outdoor, clear, blurry)
  3. Verify vocabulary matching accuracy
  4. Confirm pin creation in database
  5. Test error scenarios
- **Test Cases:**
  - Clear photos with common objects
  - Blurry or unclear photos
  - Photos with no recognizable objects
  - Network connectivity issues
- **Status:** 🔧 After implementation

### Task 3.3: Final UI Polish
- **User Experience Review:**
  - Smooth loading animations
  - Clear progress indicators
  - Intuitive error messages
  - Satisfying success feedback
- **Performance:**
  - Optimize image compression before API call
  - Implement request timeouts
  - Add retry logic for failed requests
- **Status:** 🔧 Final step

---

## Technical Specifications

### Gemini API Configuration
- **Model:** `gemini-2.5-flash`
- **Input:** Base64 encoded image + text prompt
- **Max Image Size:** 20MB (we'll compress to ~1MB)
- **Expected Response Time:** 2-5 seconds
- **Cost:** ~$0.0025 per image analysis

### Database Schema Requirements
- ✅ `master_vocabulary` table exists with searchable words
- ✅ `map_pins` table exists for location tracking
- ✅ RLS policies configured for user data protection

### Frontend State Management
```typescript
interface PhotoAnalysisState {
  isProcessing: boolean;
  currentStep: 'capturing' | 'analyzing' | 'finding' | 'complete';
  error: string | null;
  foundCards: VocabularyCard[];
}
```

---

## Success Criteria

### Functional Requirements
- [ ] User can take a photo and receive relevant vocabulary cards
- [ ] System accurately identifies common objects in photos
- [ ] Database correctly matches keywords to vocabulary entries
- [ ] Location pins are created for each analyzed photo
- [ ] Error states are handled gracefully

### Performance Requirements
- [ ] Photo analysis completes within 10 seconds
- [ ] UI remains responsive during processing
- [ ] Image compression reduces file size without losing recognition accuracy

### User Experience Requirements
- [ ] Clear feedback during processing steps
- [ ] Intuitive error messages
- [ ] Satisfying discovery experience when cards are found

---

## Risk Mitigation

### Potential Issues & Solutions
1. **Gemini API Rate Limits**
   - Solution: Implement exponential backoff retry logic
   
2. **Poor Image Recognition Accuracy**
   - Solution: Refine prompts, add image preprocessing
   
3. **Limited Vocabulary Matches**
   - Solution: Expand master vocabulary database, implement fuzzy matching

4. **High API Costs**
   - Solution: Image compression, caching common results

---

## Implementation Order

1. ✅ **Backend:** Tasks 1.1-1.5 - Complete backend functionality
2. ✅ **Frontend:** Tasks 2.1-2.5 - Connect React components and configuration
3. 🔧 **Deployment:** Deploy Edge Function to Supabase
4. 🔧 **Testing:** Task 3.2 - Manual verification with real API
5. 🔧 **Polish:** Task 3.3 - Final UX improvements

## Deployment Steps

### Deploy Edge Function to Supabase
1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g @supabase/cli
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to your project**
   ```bash
   supabase link --project-ref jdmzqrbabxnaarihvwfp
   ```

4. **Deploy the Edge Function**
   ```bash
   supabase functions deploy find-vocabulary-for-photo
   ```

5. **Set Environment Variables**
   ```bash
   supabase secrets set GEMINI_API_KEY=your_api_key_here
   ```

### Enable Real API
1. **Get Gemini API Key** from Google AI Studio
2. **Update Configuration** in `src/services/config.ts`:
   ```typescript
   USE_REAL_GEMINI_API: true
   ```
3. **Test with real photos** to verify functionality

---

## Notes

- Keep mock AI service available for development speed
- Use real API for final testing and verification
- Consider implementing caching for common photo/keyword combinations
- Monitor API usage and costs during development 