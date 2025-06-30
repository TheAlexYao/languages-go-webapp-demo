-- Migration: Create Translations Table for Multi-Language Support
-- This creates a separate table to store translations for each vocabulary word

-- First, let's create a translations table
CREATE TABLE IF NOT EXISTS vocabulary_translations (
    id BIGSERIAL PRIMARY KEY,
    vocabulary_id BIGINT NOT NULL REFERENCES master_vocabulary(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    translation TEXT NOT NULL,
    pronunciation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vocabulary_id, language_code)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS vocabulary_translations_vocabulary_id_idx ON vocabulary_translations(vocabulary_id);
CREATE INDEX IF NOT EXISTS vocabulary_translations_language_code_idx ON vocabulary_translations(language_code);

-- Enable RLS
ALTER TABLE vocabulary_translations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Translations are readable by all" 
ON vocabulary_translations FOR SELECT 
TO authenticated, anon 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_vocabulary_translations_updated_at 
    BEFORE UPDATE ON vocabulary_translations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing translations from master_vocabulary
INSERT INTO vocabulary_translations (vocabulary_id, language_code, translation)
SELECT id, 'es', translation 
FROM master_vocabulary 
WHERE translation IS NOT NULL AND language = 'en'
ON CONFLICT (vocabulary_id, language_code) DO NOTHING;

-- Add a column to master_vocabulary to mark it as using English as base
ALTER TABLE master_vocabulary 
ADD COLUMN IF NOT EXISTS is_base_english BOOLEAN DEFAULT true;

-- Update the master_vocabulary to remove the translation column (after migration)
-- Note: This should be done after verifying all translations are migrated
-- ALTER TABLE master_vocabulary DROP COLUMN translation;

-- Add supported languages table
CREATE TABLE IF NOT EXISTS supported_languages (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    native_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert supported languages
INSERT INTO supported_languages (code, name, native_name) VALUES
('en', 'English', 'English'),
('es', 'Spanish', 'Español'),
('fr', 'French', 'Français'),
('de', 'German', 'Deutsch'),
('it', 'Italian', 'Italiano'),
('pt', 'Portuguese', 'Português'),
('ja', 'Japanese', '日本語'),
('ko', 'Korean', '한국어'),
('zh', 'Chinese', '中文')
ON CONFLICT (code) DO NOTHING;

-- Create a view for easy access to vocabulary with all translations
CREATE OR REPLACE VIEW vocabulary_with_translations AS
SELECT 
    mv.id,
    mv.word,
    mv.language as base_language,
    mv.category,
    mv.difficulty,
    mv.rarity,
    mv.base_image_url,
    mv.audio_url,
    json_object_agg(
        vt.language_code, 
        json_build_object(
            'translation', vt.translation,
            'pronunciation', vt.pronunciation
        )
    ) FILTER (WHERE vt.language_code IS NOT NULL) as translations
FROM master_vocabulary mv
LEFT JOIN vocabulary_translations vt ON mv.id = vt.vocabulary_id
GROUP BY mv.id;

-- Grant access to the view
GRANT SELECT ON vocabulary_with_translations TO authenticated, anon;