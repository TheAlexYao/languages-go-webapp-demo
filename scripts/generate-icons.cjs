#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if sharp is available (for high-quality image conversion)
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('⚠️  Sharp not found. Installing...');
  console.log('Run: npm install sharp --save-dev');
  process.exit(1);
}

const SVG_PATH = path.join(__dirname, '../public/icons/map-kun.svg');
const OUTPUT_DIR = path.join(__dirname, '../public');

// Icon sizes needed for various platforms
const ICON_SIZES = [
  // Favicon sizes
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  
  // Apple Touch Icons
  { size: 57, name: 'apple-touch-icon-57x57.png' },
  { size: 60, name: 'apple-touch-icon-60x60.png' },
  { size: 72, name: 'apple-touch-icon-72x72.png' },
  { size: 76, name: 'apple-touch-icon-76x76.png' },
  { size: 114, name: 'apple-touch-icon-114x114.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 144, name: 'apple-touch-icon-144x144.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  
  // Android Chrome Icons
  { size: 36, name: 'android-chrome-36x36.png' },
  { size: 48, name: 'android-chrome-48x48.png' },
  { size: 72, name: 'android-chrome-72x72.png' },
  { size: 96, name: 'android-chrome-96x96.png' },
  { size: 144, name: 'android-chrome-144x144.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 256, name: 'android-chrome-256x256.png' },
  { size: 384, name: 'android-chrome-384x384.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  
  // Microsoft Tiles
  { size: 70, name: 'mstile-70x70.png' },
  { size: 144, name: 'mstile-144x144.png' },
  { size: 150, name: 'mstile-150x150.png' },
  { size: 310, name: 'mstile-310x310.png' },
];

async function generateIcons() {
  console.log('🎨 Generating app icons from map-kun.svg...\n');
  
  // Check if SVG exists
  if (!fs.existsSync(SVG_PATH)) {
    console.error('❌ SVG file not found at:', SVG_PATH);
    process.exit(1);
  }
  
  // Create icons directory if it doesn't exist
  const iconsDir = path.join(OUTPUT_DIR, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Read the SVG file
  const svgBuffer = fs.readFileSync(SVG_PATH);
  
  // Generate each icon size
  for (const { size, name } of ICON_SIZES) {
    try {
      console.log(`📱 Generating ${name} (${size}x${size})`);
      
      await sharp(svgBuffer)
        .resize(size, size, { 
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, name));
        
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }
  
  // Generate ICO file for favicon
  console.log('🖼️  Generating favicon.ico...');
  try {
    // Generate 32x32 PNG first, then convert to ICO
    const favicon32 = await sharp(svgBuffer)
      .resize(32, 32, { 
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    
    // For now, just save as PNG. For true ICO format, we'd need additional tools
    fs.writeFileSync(path.join(OUTPUT_DIR, 'favicon.png'), favicon32);
    
    // Copy original SVG to public root for modern browsers
    fs.copyFileSync(SVG_PATH, path.join(OUTPUT_DIR, 'favicon.svg'));
    
  } catch (error) {
    console.error('❌ Failed to generate favicon:', error.message);
  }
  
  // Generate PWA manifest icons
  console.log('📱 Generating PWA manifest...');
  await generatePWAManifest();
  
  console.log('\n✅ Icon generation complete!');
  console.log('📝 Next steps:');
  console.log('   1. Update index.html with new favicon links');
  console.log('   2. Update PWA manifest');
  console.log('   3. Add logo to app header');
}

async function generatePWAManifest() {
  const manifest = {
    name: "Languages Go!",
    short_name: "Languages Go",
    description: "Catch vocabulary in the wild",
    start_url: "/",
    display: "standalone",
    theme_color: "#2563eb",
    background_color: "#ffffff",
    icons: [
      {
        src: "android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}

// Run the script
generateIcons().catch(console.error); 