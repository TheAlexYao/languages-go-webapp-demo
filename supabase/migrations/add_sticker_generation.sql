-- Create storage bucket for stickers if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stickers',
  'stickers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create table for tracking sticker generation jobs
CREATE TABLE IF NOT EXISTS public.sticker_generation_jobs (
  id VARCHAR(255) PRIMARY KEY,
  card_id UUID REFERENCES vocabulary_cards(id) ON DELETE CASCADE,
  word VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  category VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  sticker_url TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_sticker_jobs_status ON sticker_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sticker_jobs_card_id ON sticker_generation_jobs(card_id);
CREATE INDEX IF NOT EXISTS idx_sticker_jobs_created_at ON sticker_generation_jobs(created_at);

-- Add sticker-related columns to vocabulary_cards if they don't exist
ALTER TABLE vocabulary_cards 
ADD COLUMN IF NOT EXISTS sticker_prompt TEXT,
ADD COLUMN IF NOT EXISTS sticker_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sticker_version INTEGER DEFAULT 1;

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sticker_generation_jobs
DROP TRIGGER IF EXISTS update_sticker_generation_jobs_updated_at ON sticker_generation_jobs;
CREATE TRIGGER update_sticker_generation_jobs_updated_at
  BEFORE UPDATE ON sticker_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for cards needing stickers
CREATE OR REPLACE VIEW cards_needing_stickers AS
SELECT 
  vc.id,
  vc.word,
  vc.translation,
  vc.language_detected,
  vc.category,
  vc.difficulty,
  vc.created_at
FROM vocabulary_cards vc
WHERE (vc.ai_image_url IS NULL OR vc.ai_image_url = '' OR vc.ai_image_url NOT LIKE '%stickers%')
  AND NOT EXISTS (
    SELECT 1 FROM sticker_generation_jobs sgj 
    WHERE sgj.card_id = vc.id 
    AND sgj.status IN ('pending', 'processing', 'completed')
  )
ORDER BY vc.created_at DESC;

-- Create RLS policies for sticker_generation_jobs
ALTER TABLE sticker_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read sticker jobs
CREATE POLICY "Users can read sticker jobs" ON sticker_generation_jobs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow service role to manage sticker jobs
CREATE POLICY "Service role can manage sticker jobs" ON sticker_generation_jobs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON cards_needing_stickers TO authenticated;
GRANT SELECT ON sticker_generation_jobs TO authenticated;
GRANT ALL ON sticker_generation_jobs TO service_role;