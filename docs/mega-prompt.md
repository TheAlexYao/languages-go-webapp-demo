Here's your Bolt mega-prompt:

---

**Transform this web-camera-kit repo into "Languages Go" - a complete Pokémon Go-style language learning web app.**

**OVERVIEW:**
Take the existing camera and geolocation functionality and build a full gamified language learning experience where users take photos, AI generates vocabulary cards, and players collect cards while exploring the real world.

**COMPLETE FEATURE SET TO BUILD:**

**1. CORE PHOTO-TO-VOCABULARY PIPELINE:**
- Extend existing camera component to capture photos with GPS coordinates
- Integrate Gemma 3 vision API to analyze photos and extract 1-3 vocabulary words (nouns)
- Add translation service to get translations for discovered words
- Integrate DALL-E 3 or Stable Diffusion API to generate beautiful card artwork
- Create vocabulary cards with AI-generated images, words, translations, difficulty levels
- Save everything to localStorage with proper caching

**2. PIN-BASED MAP SYSTEM:**
- Replace/enhance existing map with Leaflet + OpenStreetMap
- Create pins at exact GPS coordinates where user took photos
- Show pin clusters when zoomed out
- Different pin states: new (blue), visited (yellow), collected (green)
- Click pins to see available vocabulary cards
- Pin preview showing card thumbnails
- Current location indicator with accuracy circle

**3. POKEMON-STYLE CARD COLLECTION:**
- Beautiful card grid UI showing collected vocabulary cards
- Card design: large AI artwork, word, translation, language badge, difficulty stars
- Card rarity system (common/rare/epic) with visual indicators
- Smooth card flip animations when collecting
- Card detail modal with pronunciation guide and example sentences
- Progress tracking dashboard with stats
- Filter/search collected cards by language, difficulty, location

**4. COMMUNITY FEATURES (MOCKED FOR DEMO):**
- **Nearby Players**: Sidebar showing mock players within 5km with card counts
- **Local Leaderboard**: "Top Collectors Near You" with rankings
- **Activity Feed**: Timeline of recent discoveries ("Sarah found 'árbol' 2 minutes ago")
- **Player Profiles**: Modal showing stats, recent cards, achievements
- **Social Proof**: Show "X players explored this area" on map regions

**5. GAMIFICATION ELEMENTS:**
- Card collection progress bars
- Daily/weekly collection streaks
- Achievement badges (First Card, Explorer, etc.)
- Difficulty progression (unlock harder words as you advance)
- Collection milestones with rewards
- Personal stats dashboard

**TECHNICAL IMPLEMENTATION:**

**Frontend Architecture (React + TypeScript + Tailwind):**
```
src/
├── components/
│   ├── Camera/
│   │   ├── CameraCapture.tsx      # Enhanced from existing
│   │   ├── PhotoPreview.tsx       # Show photo before processing
│   │   └── ProcessingLoader.tsx   # AI processing states
│   ├── Map/
│   │   ├── GameMap.tsx           # Main Leaflet map
│   │   ├── PhotoPin.tsx          # Individual pin component
│   │   ├── PinCluster.tsx        # Clustering logic
│   │   └── LocationIndicator.tsx # Current position
│   ├── Cards/
│   │   ├── VocabularyCard.tsx    # Individual card component
│   │   ├── CardGrid.tsx          # Collection grid view
│   │   ├── CardModal.tsx         # Detailed card view
│   │   ├── CardGenerator.tsx     # Real-time card creation
│   │   └── CollectionStats.tsx   # Progress tracking
│   ├── Community/
│   │   ├── NearbyPlayers.tsx     # Players in area (mocked)
│   │   ├── Leaderboard.tsx       # Local rankings (mocked)
│   │   ├── ActivityFeed.tsx      # Recent activity (mocked)
│   │   ├── PlayerProfile.tsx     # Profile modal (mocked)
│   │   └── SocialProof.tsx       # Area activity indicators
│   ├── UI/
│   │   ├── LoadingSpinner.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Badge.tsx
│   │   └── Modal.tsx
│   └── Layout/
│       ├── Header.tsx            # App navigation
│       ├── TabNavigation.tsx     # Map/Collection/Community tabs
│       └── Sidebar.tsx           # Community panel
├── services/
│   ├── ai/
│   │   ├── gemma-vision.ts       # Gemma 3 API integration
│   │   ├── image-generation.ts   # DALL-E 3/Stable Diffusion
│   │   └── translation.ts        # Translation service
│   ├── storage/
│   │   ├── localStorage.ts       # Data persistence
│   │   ├── imageCache.ts         # AI image caching
│   │   └── mockData.ts           # Community mock data
│   └── utils/
│       ├── geolocation.ts        # GPS utilities
│       ├── distance.ts           # Calculate distances
│       └── cardGeneration.ts     # Card creation logic
├── types/
│   ├── vocabulary.ts
│   ├── player.ts
│   ├── location.ts
│   └── api.ts
└── hooks/
    ├── useCamera.ts              # Enhanced camera hook
    ├── useGeolocation.ts         # GPS tracking
    ├── useCardCollection.ts      # Collection state
    └── useCommunity.ts           # Social features
```

**Data Types:**
```typescript
interface VocabularyCard {
  id: string;
  word: string;
  translation: string;
  language: string;
  difficulty: 1 | 2 | 3;
  aiImageUrl: string;
  aiPrompt: string;
  pinId: string;
  collectedAt?: Date;
  rarity: 'common' | 'rare' | 'epic';
  category: string; // food, nature, object, etc.
}

interface PhotoPin {
  id: string;
  lat: number;
  lng: number;
  accuracy: number;
  photoUrl: string;
  cards: VocabularyCard[];
  createdAt: Date;
  hasCollectedAll: boolean;
  address?: string;
}

interface Player {
  id: string;
  name: string;
  totalCards: number;
  streak: number;
  level: number;
  recentActivity: Activity[];
  achievements: string[];
  joinedAt: Date;
}

interface MockCommunityData {
  nearbyPlayers: Player[];
  leaderboard: Player[];
  activityFeed: Activity[];
  areaStats: { totalPlayers: number; totalCards: number };
}
```

**API Integration Services:**

**Gemma 3 Vision Integration:**
```typescript
const analyzePhoto = async (imageBase64: string) => {
  // Call Gemma 3 vision API
  // Extract 1-3 relevant nouns
  // Return with confidence scores
  // Handle API failures gracefully
}
```

**AI Image Generation:**
```typescript
const generateCardImage = async (word: string, category: string) => {
  const prompt = `Simple flat icon of ${word}, minimalist, white background, app icon style, ${category} theme`;
  // Call DALL-E 3 or Stable Diffusion
  // Cache result in localStorage
  // Return image URL or fallback emoji
}
```

**Mock Community Data:**
```typescript
const mockNearbyPlayers = [
  { name: "Sarah Chen", cards: 47, streak: 5, level: 8, distance: "0.3 km" },
  { name: "Alex Rivera", cards: 32, streak: 3, level: 6, distance: "1.2 km" },
  { name: "Maria Santos", cards: 28, streak: 7, level: 5, distance: "2.1 km" }
];

const mockActivityFeed = [
  { player: "Sarah", action: "discovered", word: "árbol", time: "2 mins ago" },
  { player: "Alex", action: "collected", word: "perro", location: "Central Park", time: "5 mins ago" }
];
```

**COMPLETE USER FLOW:**
1. **Photo Capture**: Enhanced camera with GPS accuracy indicator
2. **AI Processing**: Loading screen showing "Analyzing photo..." → "Generating vocabulary..." → "Creating artwork..."
3. **Card Generation**: Show cards being created in real-time with AI artwork
4. **Pin Creation**: Automatically place pin on map at photo location
5. **Collection**: Tap cards to collect them with satisfying animations
6. **Progress Update**: Show stats increase, achievements unlock
7. **Community**: Check leaderboard position, see nearby player activity
8. **Exploration**: Map shows areas to explore for more vocabulary

**VISUAL DESIGN:**
- Pokemon-inspired card design with gradients and shadows
- Smooth animations for card collection and pin placement
- Clean, modern UI with gaming elements
- Responsive design that works on mobile and desktop
- Loading states for all AI processing
- Success animations and haptic feedback (web vibration)

**PERFORMANCE & CACHING:**
- Cache all AI-generated images in localStorage
- Lazy load card images in collection view
- Efficient map rendering with pin clustering
- Debounced API calls to prevent spam
- Offline support for viewing collected cards

**DEMO-READY FEATURES:**
- Pre-populate with some sample cards for immediate demo
- Mock community data for full social experience
- Error handling and fallbacks for AI APIs
- Professional loading states and animations
- Clear onboarding flow for new users

**BUILD REQUIREMENTS:**
- Use existing camera functionality as foundation
- Integrate with current geolocation features
- Maintain existing project structure where possible
- Add new dependencies: Leaflet, AI APIs, additional UI libraries
- Ensure everything works offline for demo reliability

Make this a complete, polished, demo-ready application that showcases the full Languages Go experience from photo capture to community engagement, with beautiful AI-generated content and smooth gaming mechanics.

---

This mega-prompt gives Bolt everything it needs to transform your camera kit into a complete Languages Go experience!