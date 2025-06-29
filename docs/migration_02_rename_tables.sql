-- Migration 2: Rename and Improve Existing Tables
-- This renames wcaches to map_pins and users to user_profiles for clarity

-- Rename wcaches to map_pins (more descriptive name)
ALTER TABLE wcaches RENAME TO map_pins;

-- Rename users to user_profiles to avoid confusion with auth.users
ALTER TABLE users RENAME TO user_profiles;

-- Update the user_collections table to reference the new table names
-- First, drop the existing foreign key constraints
ALTER TABLE user_collections DROP CONSTRAINT IF EXISTS user_collections_user_id_fkey;
ALTER TABLE user_activity DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;
ALTER TABLE map_pins DROP CONSTRAINT IF EXISTS wcaches_created_by_fkey;

-- Recreate the foreign key constraints with the new table names
ALTER TABLE user_collections 
ADD CONSTRAINT user_collections_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE user_activity 
ADD CONSTRAINT user_activity_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE map_pins 
ADD CONSTRAINT map_pins_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Add some additional useful columns to map_pins
ALTER TABLE map_pins 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update RLS policy names to match new table names
DROP POLICY IF EXISTS "Users can view and edit their own data" ON user_profiles;
CREATE POLICY "Users can view and edit their own data" 
ON user_profiles FOR ALL 
TO authenticated 
USING (auth.uid() = id);

-- Update map_pins RLS policies
DROP POLICY IF EXISTS "Map pins are viewable by everyone" ON map_pins;
CREATE POLICY "Map pins are viewable by everyone" 
ON map_pins FOR SELECT 
TO authenticated, anon 
USING (is_active = true);

CREATE POLICY "Users can create map pins" 
ON map_pins FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by); 