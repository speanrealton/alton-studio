-- Create community_settings table for storing user community preferences
CREATE TABLE IF NOT EXISTS community_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_view TEXT DEFAULT 'grid', -- 'grid' or 'list'
  show_trending_circles BOOLEAN DEFAULT true,
  show_latest_posts BOOLEAN DEFAULT true,
  posts_per_page INTEGER DEFAULT 10,
  sort_by TEXT DEFAULT 'latest', -- 'latest', 'trending', 'oldest'
  enable_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_community_settings_user_id ON community_settings(user_id);

-- Enable RLS
ALTER TABLE community_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read their own settings"
  ON community_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON community_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON community_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the timestamp
DROP TRIGGER IF EXISTS update_community_settings_timestamp_trigger ON community_settings;
CREATE TRIGGER update_community_settings_timestamp_trigger
BEFORE UPDATE ON community_settings
FOR EACH ROW
EXECUTE FUNCTION update_community_settings_timestamp();
