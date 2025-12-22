-- Create video_likes table for proper like tracking
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES printing_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one like per user per video
  UNIQUE(video_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_created_at ON video_likes(created_at);

-- Enable RLS
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;

-- Allow users to see all likes
CREATE POLICY "Users can view all likes" ON video_likes
  FOR SELECT USING (true);

-- Allow users to insert their own likes
CREATE POLICY "Users can like videos" ON video_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own likes
CREATE POLICY "Users can unlike videos" ON video_likes
  FOR DELETE USING (user_id = auth.uid());

-- Function to update printing_videos likes_count when a like is added/removed
CREATE OR REPLACE FUNCTION update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE printing_videos
    SET likes = (SELECT COUNT(*) FROM video_likes WHERE video_id = NEW.video_id)
    WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE printing_videos
    SET likes = (SELECT COUNT(*) FROM video_likes WHERE video_id = OLD.video_id)
    WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update likes count
DROP TRIGGER IF EXISTS trigger_update_video_likes_count ON video_likes;
CREATE TRIGGER trigger_update_video_likes_count
AFTER INSERT OR DELETE ON video_likes
FOR EACH ROW
EXECUTE FUNCTION update_video_likes_count();
