# Languages Go: Full Implementation Plan

## Setup Progress ✅

**Completed:**
- ✅ Node.js and npm installed (v24.3.0 / v11.4.2)
- ✅ Supabase JavaScript client installed (@supabase/supabase-js)
- ✅ Supabase CLI installed (v2.26.9)
- ✅ Created `src/services/supabase.ts` with all necessary functions
- ✅ Created `env.template` with required environment variables
- ✅ Created `.cursor/mcp.json` with official Supabase MCP server configuration
- ✅ **MCP Server Working**: Successfully connected to Supabase project `jdmzqrbabxnaarihvwfp`
- ✅ **Database Migrations Complete**: Applied all schema migrations successfully
- ✅ **Master Vocabulary**: 39 vocabulary words populated across 5 categories
- ✅ **PostGIS Enabled**: Geospatial queries ready for location-based features

**Database Tables (Updated Schema):**
- ✅ `master_vocabulary` - Single source of truth for vocabulary words (39 entries)
- ✅ `user_profiles` - User profiles and authentication (renamed from `users`)
- ✅ `map_pins` - Location-based pins on the map (renamed from `wcaches`, enhanced)
- ✅ `vocabulary_cards` - Generated cards linked to map pins
- ✅ `user_collections` - User's collected cards with mastery tracking
- ✅ `user_activity` - Activity feed for user actions

**Database Features:**
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Anonymous user access to master vocabulary
- ✅ Proper foreign key relationships maintained
- ✅ Automatic timestamp triggers

**Vocabulary Categories:**
- 🌿 Nature & Outdoors (8 words): tree, flower, sun, moon, star, water, stone, sky
- 🏙️ Urban & City Life (10 words): house, door, window, street, car, bus, bicycle, bridge, sign, chair, table
- 🍎 Food & Drink (7 words): apple, banana, bread, coffee, tea, cup, plate
- 📚 Home & Everyday Objects (9 words): book, pen, key, phone, computer, watch, bed, lamp, money
- ✈️ Travel (4 words): ticket, train, airplane, boat

**Ready for Phase 1:**
1. ✅ Database schema complete
2. ✅ Master vocabulary populated
3. ✅ RLS policies configured
4. 🎯 **NEXT**: Configure anonymous authentication

---

## Core Philosophy: The Hybrid AI Model

To ensure a fast, cost-effective, and polished user experience, we will use a hybrid model that combines the magic of real-time AI with the reliability of pre-generated content.

1.  **Pre-Generated Content**: We will create a master library of 100-200 high-quality, curated vocabulary cards. This gives us complete control over the art style, quality, and content, while eliminating runtime AI costs for image generation and translation.
2.  **Real-Time Analysis**: When a user takes a photo, we will make a single, fast API call to a vision model to get descriptive labels (e.g., "dog," "tree").
3.  **Intelligent Matching**: The backend will then look up these labels in our pre-generated library and return the matching high-quality cards to the user.

This approach provides the *feeling* of hyper-personalized AI generation without the associated costs, latency, and unpredictability.

---

## Task 0: Content Pre-Generation (Developer Task)

This is a preparatory task that can be executed in parallel with application development.

-   **Step 1: Curate Vocabulary List**: ✅ **COMPLETE** - Selected 39 high-frequency nouns across 5 categories
-   **Step 2: Define Generation Schema**: For each vocabulary word, create a structured JSON file based on the provided schema. This defines the exact prompt, color palette, and features for its "Kawaii Critter" artwork, ensuring a consistent brand style.
-   **Step 3: Script Image Generation**: Write a script (e.g., Node.js, Python) to loop through the JSON files, call an image generation API (like DALL-E 3 or Midjourney) with the defined prompts, and save the resulting images.
-   **Step 4: Script Database Population**: Write a second script to upload the generated images to a Supabase Storage bucket and populate the `master_vocabulary` table with the word, translation, and public image URL for each card.

---

## ✅ Phase 1: Foundation - Anonymous Auth & Database (COMPLETE)

**Goal**: Establish a secure, personalized foundation before writing any game logic.

-   **Step 1.1: Configure Supabase Auth**: ✅ **COMPLETE** - Anonymous authentication configured and working
-   **Step 1.2: Implement Anonymous Sign-in on App Load**: ✅ **COMPLETE** - `src/App.tsx` updated with automatic anonymous authentication
-   **Step 1.3: Design Database Schema**: ✅ **COMPLETE** - All tables created with proper relationships and RLS
    -   ✅ `master_vocabulary`: Stores the pre-generated cards (id, word, translation, base_image_url, rarity, difficulty).
    -   ✅ `user_collections`: A join table linking users to the cards they've collected (user_id, card_id, collected_at).
    -   ✅ `map_pins`: Stores the locations where users took photos (id, created_by, lat, lng, created_at).
-   **Step 1.4: Enable Row-Level Security (RLS)**: ✅ **COMPLETE** - RLS activated on all tables with proper policies for user data privacy.

**Phase 1 Achievements:**
1. ✅ Created `.env` file with Supabase credentials
2. ✅ Updated `src/App.tsx` with anonymous authentication flow
3. ✅ Updated `src/hooks/useCardCollection.ts` to use Supabase instead of localStorage
4. ✅ Updated `src/services/supabase.ts` with corrected table references
5. ✅ Authentication state management with loading and error states
6. ✅ Real-time auth state listening

---

## 🎯 Phase 2: Backend - The Core Game Loop (CURRENT PHASE)

**Goal**: Create the secure server-side logic that powers the photo-to-card experience.

-   **Step 2.1: Create Supabase Edge Function**: Create a new Deno-based Edge Function named `find-cards-for-photo` located at `supabase/functions/find-cards-for-photo/index.ts`.
-   **Step 2.2: Implement Function Logic**:
    1.  The function will accept `image_data` (as base64) and `location` coordinates.
    2.  It will automatically verify the user's authentication token.
    3.  It will call a fast, third-party vision AI service (e.g., Google Vision API) to get descriptive labels for the image.
    4.  It will query the `master_vocabulary` table to find cards that match the returned labels.
    5.  It will create a new entry in the `map_pins` table associated with the user's ID and location.
    6.  It will return the array of matched vocabulary cards and the newly created pin data to the frontend.
-   **Step 2.3: Secure API Keys**: Store all third-party API keys (e.g., for the vision model) as encrypted secrets in Supabase using `supabase secrets set`, never hard-coding them in the function.

**Phase 2 Progress:**
- 🔧 **Next**: Create the Edge Function for photo analysis
- 🔧 **Next**: Implement mock photo-to-vocabulary matching (for testing without AI)
- 🔧 **Next**: Test the complete photo capture → card generation flow

---

## Phase 3: Frontend - Connecting the UI

**Goal**: Wire up the React components to the new Supabase backend, replacing all mock data and services.

-   **Step 3.1: Create a Supabase Service**: ✅ **COMPLETE** - `src/services/supabase.ts` exists with helper functions
-   **Step 3.2: Update `PhotoCapture.tsx`**:
    -   Replace all calls to the mock AI service with our new `findCardsFromPhoto` service function.
    -   Update the `isProcessingPhoto` state management to provide user feedback during the analysis ("Analyzing photo...", "Finding cards...").
-   **Step 3.3: Update `useCardCollection.ts` Hook**:
    -   Refactor the hook to be Supabase-aware.
    -   On load, it will fetch the user's cards by querying the `user_collections` table.
    -   The `collectCard` function will now write a new entry to this table instead of using `localStorage`.
-   **Step 3.4: Update UI Components**:
    -   Update `VocabularyCard.tsx` and `CardModal.tsx` to display the rich data from the database (AI image, rarity, etc.).
    -   Update `GameMap.tsx` to fetch and display pins from the `map_pins` table for the currently logged-in user. 