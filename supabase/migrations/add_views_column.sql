-- Add views column to printing_videos if it doesn't exist
ALTER TABLE printing_videos
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Add shares column if it doesn't exist
ALTER TABLE printing_videos
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;

-- Create index for views for faster queries
CREATE INDEX IF NOT EXISTS idx_printing_videos_views ON printing_videos(views DESC);
CREATE INDEX IF NOT EXISTS idx_printing_videos_shares ON printing_videos(shares DESC);
