-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('billing', 'technical', 'orders', 'design', 'account', 'general')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'support')),
  content TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support Team Members Table
CREATE TABLE IF NOT EXISTS support_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'agent',
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- RLS Policies for support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own support tickets" ON support_tickets;
CREATE POLICY "Users can view their own support tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'support_admin');

DROP POLICY IF EXISTS "Users can create support tickets" ON support_tickets;
CREATE POLICY "Users can create support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own support tickets" ON support_tickets;
CREATE POLICY "Users can update their own support tickets"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'support_admin');

-- RLS Policies for support_messages
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages from their own tickets" ON support_messages;
CREATE POLICY "Users can view messages from their own tickets"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' = 'support_admin'
  );

DROP POLICY IF EXISTS "Users can insert messages in their tickets" ON support_messages;
CREATE POLICY "Users can insert messages in their tickets"
  ON support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for support_team
ALTER TABLE support_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Support team members can view the team" ON support_team;
CREATE POLICY "Support team members can view the team"
  ON support_team FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can manage team" ON support_team;
CREATE POLICY "Only admins can manage team"
  ON support_team FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'authenticated');

DROP POLICY IF EXISTS "Team members can update their own status" ON support_team;
CREATE POLICY "Team members can update their own status"
  ON support_team FOR UPDATE
  USING (auth.uid() = user_id);
