# Languages Go! 🌍📸

**Catch vocab in the wild** - An AI-powered language learning app that discovers vocabulary from real-world photos using Google Gemini.

## 🚀 Live Demo

Experience vocabulary discovery in action! Take photos of everyday objects and instantly learn words in 6 different languages.

<img src="./public/demo1.gif" alt="Languages Go Demo" width="700" />

## ✨ Key Features

### 🤖 **AI-Powered Vocabulary Discovery**
- **Google Gemini 2.5 Flash** integration for real-time photo analysis
- Smart object detection and keyword extraction
- Intelligent vocabulary matching with prioritization system

### 🌍 **Multi-Language Support**
- **6 Languages**: Spanish 🇪🇸, French 🇫🇷, German 🇩🇪, Italian 🇮🇹, Japanese 🇯🇵, Thai 🇹🇭
- Real-time language switching with beautiful flag-based UI
- Normalized database architecture for scalable language expansion

### 🎯 **Smart Learning Experience**
- **Maximum 4 cards per photo** for optimal learning retention
- Intelligent prioritization: Category → Difficulty → Rarity
- Focus on practical vocabulary (people, home, objects, electronics)

### 📱 **Mobile-First PWA**
- Responsive design optimized for mobile photography
- PWA capabilities with branded install prompt
- Offline-ready with local photo storage

### 🗃️ **Advanced Database Architecture**
- Multi-table vocabulary system with concepts, translations, and keywords
- 24+ common vocabulary concepts across all supported languages
- Efficient lookup and matching algorithms

## 🎯 Perfect For

- **Language Learners** - Discover vocabulary from everyday surroundings
- **Educators** - Interactive tool for vocabulary building
- **Travelers** - Learn local language through real-world objects
- **AI/ML Enthusiasts** - Example of Gemini Vision API integration

## 🛠️ Tech Stack

### **Frontend**
- **React 18** + TypeScript
- **Tailwind CSS** with custom animations
- **Lucide React** icons
- **Vite** with PWA plugin

### **Backend & AI**
- **Supabase** for database and Edge Functions
- **Google Gemini 2.5 Flash** for image analysis
- **PostgreSQL** with Row Level Security
- **Serverless architecture**

### **Database Schema**
- `vocabulary_concepts` - Language-agnostic vocabulary concepts
- `vocabulary_translations` - Language-specific translations
- `vocabulary_keywords` - Detection keywords with confidence scores
- `user_collections` - User's collected vocabulary cards

## 📦 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/languages-go-webapp-demo.git
cd languages-go-webapp-demo
npm install
```

### 2. Supabase Setup
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy Edge Function
supabase functions deploy find-vocabulary-for-photo
```

### 3. Environment Configuration
```bash
# Set Gemini API key in Supabase secrets
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here

# Update src/services/config.ts
export const API_CONFIG = {
  USE_REAL_GEMINI_API: true,
  DEFAULT_LANGUAGE: 'es'
};
```

### 4. Database Setup
```bash
# Run migrations to set up vocabulary tables
supabase db push

# Seed with vocabulary data (included in migration)
# 24 concepts × 7 languages = 168 translations ready to use
```

### 5. Start Development
```bash
npm run dev
```

## 🧪 How It Works

### **Photo → Vocabulary Flow**
1. **📸 Photo Capture** - User takes photo of real-world objects
2. **🤖 Gemini Analysis** - AI identifies objects and extracts keywords
3. **🔍 Database Lookup** - Keywords matched against vocabulary database
4. **🎯 Smart Selection** - Top 4 most relevant vocabulary cards selected
5. **🃏 Learning Cards** - Display translations in user's target language

### **Example Discovery**
```
Photo of: Kitchen scene
Gemini detects: "man, chair, table, cup, plant, window"
User learning: Spanish 🇪🇸
Cards generated:
├── man → hombre (people, difficulty: 1)
├── chair → silla (home, difficulty: 1)  
├── table → mesa (home, difficulty: 1)
└── cup → taza (objects, difficulty: 1)
```

## 🚀 Deployment

### Netlify/Vercel (Frontend)
```bash
npm run build
# Deploy 'dist' folder
```

### Supabase (Backend)
```bash
# Edge Function auto-deployed
# Database migrations auto-applied
# Secrets configured via dashboard
```

## 🔧 Configuration

### Language Support
Add new languages by:
1. Adding translations to `vocabulary_translations` table
2. Updating language selector in `src/components/Layout/Header.tsx`
3. Adding flag emoji and language name

### Vocabulary Expansion
```sql
-- Add new concept
INSERT INTO vocabulary_concepts (concept_key, category, difficulty, rarity)
VALUES ('ANIMAL_PET_DOG', 'animals', 1, 'common');

-- Add translations
INSERT INTO vocabulary_translations (concept_id, language_code, word, pronunciation)
VALUES 
  (concept_id, 'es', 'perro', '/ˈpe.ro/'),
  (concept_id, 'fr', 'chien', '/ʃjɛ̃/');

-- Add detection keywords  
INSERT INTO vocabulary_keywords (concept_id, keyword, language_code, confidence)
VALUES (concept_id, 'dog', 'en', 1.0);
```

## 📱 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Camera Access | ✅ | ✅ | ✅ | ✅ |
| Gemini API | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ✅ | ✅ | ✅ |
| Offline Mode | ✅ | ✅ | ✅ | ✅ |

## 🔐 Security & Privacy

- **Secure API calls** via Supabase Edge Functions
- **No direct Gemini API exposure** to frontend
- **Row Level Security** for user data
- **Anonymous mode** supported for demos
- **Local photo storage** with automatic cleanup

## 📊 Performance

- **Smart vocabulary limiting** (4 cards max) for optimal UX
- **Efficient database queries** with proper indexing
- **Image compression** before API calls
- **Caching strategies** for vocabulary data
- **Lazy loading** for better mobile performance

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) - AI vision capabilities
- [Supabase](https://supabase.com/) - Backend infrastructure
- [React](https://reactjs.org/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling system

---

**Ready to catch vocab in the wild?** 🌍✨