-- Create quote_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected')),
  quoted_price DECIMAL(10, 2),
  printer_notes TEXT,
  delivery_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS quoted_price DECIMAL(10, 2);

ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS printer_notes TEXT;

ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS delivery_time TEXT;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_printer_id ON quote_requests(printer_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at);

-- Enable RLS
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Users can create quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Printers can update quotes" ON quote_requests;

-- RLS policies: Users can see their own quote requests
CREATE POLICY "Users can view their own quote requests" ON quote_requests
  FOR SELECT USING (
    auth.uid() = user_id OR 
    printer_id IN (SELECT id FROM printers WHERE user_id = auth.uid())
  );

-- Users can create quote requests
CREATE POLICY "Users can create quote requests" ON quote_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Printers can update their quote responses
CREATE POLICY "Printers can update quotes" ON quote_requests
  FOR UPDATE USING (
    printer_id IN (SELECT id FROM printers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    printer_id IN (SELECT id FROM printers WHERE user_id = auth.uid())
  );

-- Enable realtime for quote_requests
ALTER PUBLICATION supabase_realtime ADD TABLE quote_requests;
