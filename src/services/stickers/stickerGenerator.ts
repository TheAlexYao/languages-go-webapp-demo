import { VocabularyCard } from '../../types/vocabulary';

// Sticker style configuration based on the provided JSON schema
export interface StickerConfig {
  prompt: string;
  negative_prompt: string;
  style: string[];
  palette: {
    primary: string;
    secondary: string;
    outline: string;
    cheek_blush: string;
    background: string;
  };
  expression: string;
  features: Record<string, any>;
  shading: 'none' | 'subtle radial' | 'soft gradient';
  dimensions: {
    aspect_ratio: string;
    preferred_size_px: number;
  };
}

// Default sticker configuration
const DEFAULT_STICKER_CONFIG: Partial<StickerConfig> = {
  negative_prompt: "photorealistic, text, watermark, busy background, noise",
  style: ["kawaii", "chibi", "flat illustration", "die-cut sticker"],
  palette: {
    primary: "#FFE5B4",      // Default peachy color
    secondary: "#FF9B9B",    // Default pink accent
    outline: "#8A4F22",      // Brown outline
    cheek_blush: "#F78A54",
    background: "#FFFFFF"
  },
  shading: "subtle radial",
  dimensions: {
    aspect_ratio: "1:1",
    preferred_size_px: 1024
  }
};

// Color palettes for different categories
const CATEGORY_PALETTES: Record<string, Partial<StickerConfig['palette']>> = {
  animal: {
    primary: "#FFF4E6",
    secondary: "#8B6355"
  },
  food: {
    primary: "#FFDAB9",
    secondary: "#D2691E"
  },
  nature: {
    primary: "#90EE90",
    secondary: "#228B22"
  },
  object: {
    primary: "#E0E0E0",
    secondary: "#808080"
  },
  building: {
    primary: "#D3D3D3",
    secondary: "#696969"
  },
  person: {
    primary: "#FDBCB4",
    secondary: "#CD5C5C"
  },
  technology: {
    primary: "#E6F3FF",
    secondary: "#4169E1"
  }
};

// Expression mappings based on word characteristics (using English word)
const getExpression = (word: string, category: string): string => {
  word = word.toLowerCase();
  
  // Cute/small things get closed-eye smile
  if (word.includes('baby') || word.includes('little') || word.includes('small')) {
    return "closed-eye smile with sparkles";
  }
  
  // Food gets tongue-out expression
  if (category === 'food') {
    return "tongue-out grin";
  }
  
  // Default happy expression
  return "open-eye smile";
};

// Build features based on the word and category
const buildFeatures = (word: string, category: string): Record<string, any> => {
  const features: Record<string, any> = {};
  word = word.toLowerCase();
  
  // Add category-specific features
  switch (category) {
    case 'animal':
      features.ears = true;
      features.tail = true;
      break;
    case 'food':
      features.garnish = true;
      features.steam = word.includes('hot') || word.includes('warm') || word.includes('soup');
      break;
    case 'building':
      features.windows = true;
      features.door = true;
      break;
    case 'nature':
      features.leaves = true;
      break;
  }
  
  return features;
};

// Generate sticker configuration for a vocabulary word
export const generateStickerConfig = (card: VocabularyCard): StickerConfig => {
  const category = card.category.toLowerCase();
  const palette = {
    ...DEFAULT_STICKER_CONFIG.palette!,
    ...(CATEGORY_PALETTES[category] || {})
  };
  
  // Build the main prompt using English word for better AI understanding
  const mainSubject = card.word.toLowerCase();
  const keyTraits = getKeyTraits(card);
  const expression = getExpression(card.word, category);
  const features = buildFeatures(card.word, category);
  
  const prompt = `${mainSubject}, kawaii chibi sticker, ${keyTraits}, flat clean lines, thick outline, on white`;
  
  return {
    prompt,
    negative_prompt: DEFAULT_STICKER_CONFIG.negative_prompt!,
    style: DEFAULT_STICKER_CONFIG.style!,
    palette,
    expression,
    features,
    shading: DEFAULT_STICKER_CONFIG.shading!,
    dimensions: DEFAULT_STICKER_CONFIG.dimensions!
  };
};

// Extract key physical traits based on the English word
const getKeyTraits = (card: VocabularyCard): string => {
  const traits: string[] = [];
  const word = card.word.toLowerCase(); // Use English word
  const category = card.category.toLowerCase();
  
  // Add category-specific traits
  switch (category) {
    case 'animal':
      if (word.includes('cat') || word.includes('kitten')) traits.push('round body, pointed ears, curled tail');
      else if (word.includes('dog') || word.includes('puppy')) traits.push('floppy ears, wagging tail, round snout');
      else if (word.includes('bird')) traits.push('small wings, tiny beak, round body');
      else if (word.includes('fish')) traits.push('oval body, fins, big eyes, bubbles');
      else if (word.includes('rabbit') || word.includes('bunny')) traits.push('long ears, fluffy tail, round body');
      else traits.push('cute face, round body');
      break;
      
    case 'food':
      if (word.includes('ice cream')) traits.push('waffle cone, colorful scoops, cherry on top');
      else if (word.includes('pizza')) traits.push('triangular slice, melted cheese, toppings');
      else if (word.includes('apple')) traits.push('round red fruit, green leaf on top');
      else if (word.includes('bread')) traits.push('golden brown loaf, steam lines');
      else if (word.includes('cake')) traits.push('layered dessert, frosting, sprinkles');
      else traits.push('appetizing appearance');
      break;
      
    case 'building':
      if (word.includes('house')) traits.push('triangular roof, square base, chimney');
      else if (word.includes('tower')) traits.push('tall cylindrical shape, windows');
      else traits.push('simplified geometric shape, tiny windows');
      break;
      
    case 'nature':
      if (word.includes('tree')) traits.push('round crown, thick trunk');
      else if (word.includes('flower')) traits.push('round petals, green stem');
      else if (word.includes('sun')) traits.push('circular shape, radiating rays');
      else if (word.includes('cloud')) traits.push('fluffy shape, soft edges');
      else traits.push('organic shapes');
      break;
      
    case 'technology':
    case 'object':
      if (word.includes('computer') || word.includes('laptop')) traits.push('rectangular screen with keyboard, cute pixel eyes on screen');
      else if (word.includes('phone') || word.includes('smartphone')) traits.push('rectangular device with screen, app icons');
      else if (word.includes('keyboard')) traits.push('rectangular shape with tiny keys, cute keycaps');
      else if (word.includes('mouse')) traits.push('oval shape with cord tail, two button eyes');
      else if (word.includes('monitor') || word.includes('screen')) traits.push('rectangular display, stand base, cute face on screen');
      else if (word.includes('headphones')) traits.push('rounded ear cups, headband, music notes');
      else if (word.includes('microphone')) traits.push('cylindrical shape, mesh top, stand');
      else if (word.includes('camera')) traits.push('rectangular body with round lens eye');
      else traits.push('simplified geometric shape, friendly face');
      break;
      
    default:
      traits.push('simple rounded shape, cute features');
  }
  
  return traits.join(', ');
};

// Convert sticker config to API request format
export const configToApiRequest = (config: StickerConfig): Record<string, any> => {
  return {
    prompt: config.prompt,
    negative_prompt: config.negative_prompt,
    num_images: 1,
    aspect_ratio: config.dimensions.aspect_ratio,
    // Additional parameters can be added based on the API requirements
  };
};

// Generate a unique sticker ID based on word and language
export const generateStickerId = (word: string, language: string): string => {
  const normalizedWord = word.toLowerCase().replace(/\s+/g, '-');
  const normalizedLang = language.toLowerCase();
  return `sticker-${normalizedLang}-${normalizedWord}-${Date.now()}`;
};