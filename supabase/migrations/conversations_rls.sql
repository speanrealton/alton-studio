-- Fix RLS policies for conversations table
-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert into conversations" ON conversations;

-- Create more permissive policies that allow system operations
CREATE POLICY "Enable read for users" ON conversations
  FOR SELECT USING (
    auth.uid() = user_id OR 
    printer_id IN (SELECT id FROM printers WHERE user_id = auth.uid())
  );

CREATE POLICY "Enable insert for users and system" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    printer_id IN (SELECT id FROM printers WHERE user_id = auth.uid())
  );

CREATE POLICY "Enable update for users" ON conversations
  FOR UPDATE USING (
    auth.uid() = user_id OR
    printer_id IN (SELECT id FROM printers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    printer_id IN (SELECT id FROM printers WHERE user_id = auth.uid())
  );

-- Ensure conversations table has necessary columns
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS printer_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count_user INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count_printer INTEGER DEFAULT 0;
