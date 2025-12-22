-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'like', 'comment', 'follow'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_name TEXT, -- Who performed the action
  actor_image TEXT, -- Profile picture of who performed the action
  video_id UUID REFERENCES printing_videos(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user info columns to video_likes table if they don't exist
ALTER TABLE IF EXISTS video_likes ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE IF EXISTS video_likes ADD COLUMN IF NOT EXISTS user_image TEXT;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- RLS Policies
-- Users can see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert notifications (service role)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_video_id ON notifications(video_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = FALSE;

-- Function to create like notification
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  video_creator_id UUID;
BEGIN
  -- Get video creator
  SELECT creator_id INTO video_creator_id FROM printing_videos WHERE id = NEW.video_id;

  -- Don't notify if creator likes their own video
  IF video_creator_id IS NOT NULL AND video_creator_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      actor_name,
      actor_image,
      video_id,
      link
    ) VALUES (
      video_creator_id,
      'like',
      'Video Liked!',
      COALESCE(NEW.user_name, 'Someone') || ' liked your video',
      COALESCE(NEW.user_name, 'Someone'),
      NEW.user_image,
      NEW.video_id,
      '/marketplace?video=' || NEW.video_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for likes
DROP TRIGGER IF EXISTS trigger_notify_on_like ON video_likes;
CREATE TRIGGER trigger_notify_on_like
AFTER INSERT ON video_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_like();

-- Function to create comment notification
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  video_creator_id UUID;
  commenter_name TEXT;
  comment_text TEXT;
BEGIN
  -- Get video creator
  SELECT creator_id INTO video_creator_id FROM printing_videos WHERE id = NEW.video_id;

  -- Clean up commenter name - handle NULL and empty strings
  commenter_name := COALESCE(NULLIF(NEW.user_name, ''), NULLIF(NEW.user_name, 'undefined'), 'Someone');
  
  -- Clean up comment text
  comment_text := COALESCE(NULLIF(NEW.text, ''), 'Left a comment');

  -- Create notification if we have a video creator
  IF video_creator_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      actor_name,
      actor_image,
      video_id,
      comment_id,
      link
    ) VALUES (
      video_creator_id,
      'comment',
      'New Comment!',
      commenter_name || ' commented: "' || SUBSTRING(comment_text, 1, 50) || '..."',
      commenter_name,
      NULLIF(NEW.user_image, ''),
      NEW.video_id,
      NEW.id,
      '/marketplace?video=' || NEW.video_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comments
DROP TRIGGER IF EXISTS trigger_notify_on_comment ON comments;
CREATE TRIGGER trigger_notify_on_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_comment();
