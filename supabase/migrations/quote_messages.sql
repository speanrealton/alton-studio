-- Create quote_messages table for real-time quote negotiations
CREATE TABLE IF NOT EXISTS quote_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'printer')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quote_messages_quote_request_id ON quote_messages(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_quote_messages_sender_id ON quote_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_quote_messages_created_at ON quote_messages(created_at);

-- Enable RLS
ALTER TABLE quote_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies: Users can read messages for their quotes
CREATE POLICY "Users can read their quote messages" ON quote_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    quote_request_id IN (
      SELECT id FROM quote_requests 
      WHERE user_id = auth.uid() OR printer_id IN (
        SELECT id FROM printers WHERE user_id = auth.uid()
      )
    )
  );

-- Users can insert messages to their quotes
CREATE POLICY "Users can send messages to their quotes" ON quote_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    quote_request_id IN (
      SELECT id FROM quote_requests 
      WHERE user_id = auth.uid() OR printer_id IN (
        SELECT id FROM printers WHERE user_id = auth.uid()
      )
    )
  );

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE quote_messages;
