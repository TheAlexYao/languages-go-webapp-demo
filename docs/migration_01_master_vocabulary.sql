-- Migration 1: Create Master Vocabulary Table
-- This creates the single source of truth for all vocabulary words

CREATE TABLE IF NOT EXISTS master_vocabulary (
    id BIGSERIAL PRIMARY KEY,
    word TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    translation TEXT,
    base_image_url TEXT,
    audio_url TEXT,
    rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic')) DEFAULT 'common',
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5) DEFAULT 1,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate words in the same language
CREATE UNIQUE INDEX IF NOT EXISTS master_vocabulary_word_language_idx 
ON master_vocabulary (word, language);

-- Enable RLS
ALTER TABLE master_vocabulary ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for master vocabulary (read-only for all authenticated users)
CREATE POLICY "Master vocabulary is readable by all authenticated users" 
ON master_vocabulary FOR SELECT 
TO authenticated 
USING (true);

-- Create RLS policy for anonymous users (they can also read)
CREATE POLICY "Master vocabulary is readable by anonymous users" 
ON master_vocabulary FOR SELECT 
TO anon 
USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_master_vocabulary_updated_at 
    BEFORE UPDATE ON master_vocabulary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data from our initial vocabulary list
INSERT INTO master_vocabulary (word, language, translation, category, difficulty, rarity) VALUES
-- Nature & Outdoors
('tree', 'en', 'árbol', 'nature', 1, 'common'),
('flower', 'en', 'flor', 'nature', 1, 'common'),
('sun', 'en', 'sol', 'nature', 1, 'common'),
('moon', 'en', 'luna', 'nature', 1, 'common'),
('star', 'en', 'estrella', 'nature', 1, 'common'),
('water', 'en', 'agua', 'nature', 1, 'common'),
('stone', 'en', 'piedra', 'nature', 1, 'common'),
('sky', 'en', 'cielo', 'nature', 1, 'common'),

-- Urban & City Life
('house', 'en', 'casa', 'urban', 1, 'common'),
('door', 'en', 'puerta', 'urban', 1, 'common'),
('window', 'en', 'ventana', 'urban', 1, 'common'),
('street', 'en', 'calle', 'urban', 1, 'common'),
('car', 'en', 'coche', 'urban', 1, 'common'),
('bus', 'en', 'autobús', 'urban', 1, 'common'),
('bicycle', 'en', 'bicicleta', 'urban', 2, 'common'),
('bridge', 'en', 'puente', 'urban', 2, 'common'),
('sign', 'en', 'letrero', 'urban', 1, 'common'),
('chair', 'en', 'silla', 'urban', 1, 'common'),
('table', 'en', 'mesa', 'urban', 1, 'common'),

-- Food & Drink
('apple', 'en', 'manzana', 'food', 1, 'common'),
('banana', 'en', 'plátano', 'food', 1, 'common'),
('bread', 'en', 'pan', 'food', 1, 'common'),
('coffee', 'en', 'café', 'food', 1, 'common'),
('tea', 'en', 'té', 'food', 1, 'common'),
('cup', 'en', 'taza', 'food', 1, 'common'),
('plate', 'en', 'plato', 'food', 1, 'common'),

-- Home & Everyday Objects
('book', 'en', 'libro', 'objects', 1, 'common'),
('pen', 'en', 'bolígrafo', 'objects', 1, 'common'),
('key', 'en', 'llave', 'objects', 1, 'common'),
('phone', 'en', 'teléfono', 'objects', 1, 'common'),
('computer', 'en', 'computadora', 'objects', 2, 'common'),
('watch', 'en', 'reloj', 'objects', 1, 'common'),
('bed', 'en', 'cama', 'objects', 1, 'common'),
('lamp', 'en', 'lámpara', 'objects', 1, 'common'),
('money', 'en', 'dinero', 'objects', 1, 'common'),

-- Travel
('ticket', 'en', 'boleto', 'travel', 1, 'common'),
('train', 'en', 'tren', 'travel', 1, 'common'),
('airplane', 'en', 'avión', 'travel', 2, 'common'),
('boat', 'en', 'barco', 'travel', 1, 'common')

ON CONFLICT (word, language) DO NOTHING; 