-- Create printer_ratings table for client reviews
CREATE TABLE IF NOT EXISTS printer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one rating per user per printer
  UNIQUE(user_id, printer_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_printer_ratings_printer_id ON printer_ratings(printer_id);
CREATE INDEX IF NOT EXISTS idx_printer_ratings_user_id ON printer_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_printer_ratings_created_at ON printer_ratings(created_at);

-- Enable RLS
ALTER TABLE printer_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all ratings" ON printer_ratings;
DROP POLICY IF EXISTS "Users can create ratings" ON printer_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON printer_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON printer_ratings;

-- RLS Policies
CREATE POLICY "Users can view all ratings" ON printer_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create ratings" ON printer_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON printer_ratings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON printer_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for ratings
ALTER PUBLICATION supabase_realtime ADD TABLE printer_ratings;

-- Create a view for printer average ratings
CREATE OR REPLACE VIEW printer_rating_stats AS
SELECT 
  printer_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating)::numeric, 2) as average_rating,
  MAX(created_at) as last_review_date
FROM printer_ratings
GROUP BY printer_id;
