-- Add shop_link column to printing_videos table
ALTER TABLE printing_videos ADD COLUMN IF NOT EXISTS shop_link TEXT;

-- Create index for shop_link column
CREATE INDEX IF NOT EXISTS idx_printing_videos_shop_link ON printing_videos(shop_link) WHERE shop_link IS NOT NULL;

-- Update existing rows to have null shop_link (they won't have links yet)
UPDATE printing_videos SET shop_link = NULL WHERE shop_link IS NULL OR shop_link = '';
