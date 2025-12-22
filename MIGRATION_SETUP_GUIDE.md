# Supabase Database Migrations - Setup Guide

## Migrations to Run

You need to run these SQL migrations in your Supabase dashboard to set up the complete video marketplace system with likes, views, and shares.

### 1. First - Add Views and Shares Columns (add_views_column.sql)
```sql
-- Add views column to printing_videos if it doesn't exist
ALTER TABLE printing_videos
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Add shares column if it doesn't exist
ALTER TABLE printing_videos
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;

-- Create index for views for faster queries
CREATE INDEX IF NOT EXISTS idx_printing_videos_views ON printing_videos(views DESC);
CREATE INDEX IF NOT EXISTS idx_printing_videos_shares ON printing_videos(shares DESC);
```

**Purpose:** Adds the views and shares columns to the printing_videos table so they can be tracked.

---

### 2. Second - Create Video Likes Table (video_likes.sql)
```sql
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
```

**Purpose:** Creates the video_likes table with automatic like counting and proper RLS policies.

---

## How to Run Migrations in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL from each migration file above
5. Click **Run** to execute
6. Check for any errors

## Order of Execution

**IMPORTANT:** Run migrations in this order:
1. `add_views_column.sql` - FIRST
2. `video_likes.sql` - SECOND

---

## What Each Migration Does

### add_views_column.sql
- Adds `views` column (tracks total video views)
- Adds `shares` column (tracks total video shares)
- Creates indexes for performance

### video_likes.sql
- Creates `video_likes` table (stores individual like relationships)
- Sets up Row-Level Security (RLS) policies
- Creates automatic trigger to update like counts
- Ensures one like per user per video

---

## Features Enabled After Migrations

✅ **Views Tracking** - Increments automatically when videos finish playing
✅ **Likes System** - One like per user per video, real-time updates
✅ **Share Tracking** - Tracks shares (optional, display only)
✅ **Real-Time Updates** - All changes broadcast instantly via Supabase subscriptions
✅ **Persistent Data** - All data persists on page refresh
✅ **Security** - RLS policies ensure users can only manage their own likes

---

## Testing After Migrations

1. Visit a user profile page
2. Videos should auto-play
3. When videos finish → view count increments
4. Go to /marketplace and like a video → count updates in real-time
5. Open same profile in another browser → see updated views/likes instantly

---

## Database Schema Overview

### printing_videos table
- `id` (UUID) - Video identifier
- `views` (INT) - Total video views
- `shares` (INT) - Total video shares
- `likes` (INT) - Total likes (auto-calculated from video_likes table)
- Other fields (video_url, creator_id, description, etc.)

### video_likes table
- `id` (UUID) - Like identifier
- `video_id` (UUID) - Reference to printing_videos
- `user_id` (UUID) - Reference to auth user
- `created_at` (TIMESTAMP) - When like was created
- Constraint: One like per (video_id, user_id) pair
