// Configuration for API services
export const API_CONFIG = {
  // Set to true to use real Gemini API, false to use mock data
  USE_REAL_GEMINI_API: true,
  
  // Supported languages
  SUPPORTED_LANGUAGES: {
    'en': { name: 'English', native: 'English', flag: '🇬🇧' },
    'es': { name: 'Spanish', native: 'Español', flag: '🇪🇸' },
    'fr': { name: 'French', native: 'Français', flag: '🇫🇷' },
    'de': { name: 'German', native: 'Deutsch', flag: '🇩🇪' },
    'it': { name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
    'pt': { name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
    'ja': { name: 'Japanese', native: '日本語', flag: '🇯🇵' },
    'ko': { name: 'Korean', native: '한국어', flag: '🇰🇷' },
    'zh': { name: 'Chinese', native: '中文', flag: '🇨🇳' }
  },
  
  // Default language for vocabulary (language code)
  DEFAULT_LANGUAGE: 'es', // Spanish as default, but system supports all languages
  
  // Photo processing settings
  PHOTO_PROCESSING: {
    MAX_RETRIES: 3,
    TIMEOUT_MS: 30000, // 30 seconds
    RETRY_DELAY_MS: 1000, // 1 second
  },
  
  // Mock data settings
  MOCK_DATA: {
    // Simulate API delay for realistic UX testing
    SIMULATE_DELAY: true,
    DELAY_MS: 2000,
    
    // Mock vocabulary cards to return
    SAMPLE_CARDS: [
      'tree', 'flower', 'car', 'house', 'book', 'chair', 'table', 'window',
      'door', 'phone', 'computer', 'cup', 'plate', 'pen', 'paper', 'clock'
    ]
  }
};

// Environment detection
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;

// Development mode configuration for Supabase
export const DEV_MODE_CONFIG = {
  // Enable development mode in Supabase for more permissive policies
  ENABLE_DEV_MODE: IS_DEVELOPMENT,
  // Rate limits are 10x more generous in dev mode
  ANONYMOUS_RATE_LIMIT_MULTIPLIER: 10,
  // Auto-enable dev mode on app start in development
  AUTO_ENABLE_ON_START: IS_DEVELOPMENT,
};

// Feature flags
export const FEATURES = {
  // Enable/disable specific features
  ENABLE_PHOTO_ANALYSIS: true,
  ENABLE_LOCATION_TRACKING: true,
  ENABLE_OFFLINE_MODE: true,
  
  // Debug features
  ENABLE_DEBUG_LOGGING: IS_DEVELOPMENT,
  SHOW_API_RESPONSES: IS_DEVELOPMENT,
};

// API endpoints
export const API_ENDPOINTS = {
  GEMINI_VISION: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  SUPABASE_FUNCTION: 'find-vocabulary-for-photo',
};

// Utility function to log debug information
export const debugLog = (message: string, data?: any) => {
  if (FEATURES.ENABLE_DEBUG_LOGGING) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

// Utility function to check if we should use real API
export const shouldUseRealAPI = (): boolean => {
  // In production, always use real API if configured
  if (IS_PRODUCTION) {
    return API_CONFIG.USE_REAL_GEMINI_API;
  }
  
  // In development, respect the configuration
  return API_CONFIG.USE_REAL_GEMINI_API;
};

// Auth permission configuration
export const AUTH_CONFIG = {
  // Anonymous user limits (per hour)
  ANONYMOUS_LIMITS: {
    PINS_PER_HOUR: IS_DEVELOPMENT ? 50 : 5,      // 50 in dev, 5 in prod
    CARDS_PER_HOUR: IS_DEVELOPMENT ? 100 : 10,   // 100 in dev, 10 in prod
    PHOTOS_PER_HOUR: IS_DEVELOPMENT ? 50 : 5,    // 50 in dev, 5 in prod
  },
  // Development mode settings
  DEVELOPMENT_MODE: {
    BYPASS_RATE_LIMITS: true,
    ALLOW_UNLIMITED_ACCESS: true,
    ENABLE_DEBUG_LOGGING: true,
  },
  // Production security settings
  PRODUCTION_MODE: {
    STRICT_RATE_LIMITS: true,
    REQUIRE_CAPTCHA: true,
    ENABLE_AUDIT_LOGGING: true,
  },
}; 