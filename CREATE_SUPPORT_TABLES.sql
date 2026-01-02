-- Create support_chat_sessions table
CREATE TABLE IF NOT EXISTS support_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assigned_agent_id UUID,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'declined', 'closed'
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create support_chat_messages table
CREATE TABLE IF NOT EXISTS support_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES support_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'agent', 'system'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'support_request', etc.
  title TEXT,
  message TEXT,
  related_id UUID, -- links to session_id
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create support_team table
CREATE TABLE IF NOT EXISTS support_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  email TEXT,
  role TEXT,
  status TEXT DEFAULT 'available', -- 'available', 'busy', 'offline'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_user_id ON support_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_assigned_agent_id ON support_chat_sessions(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_status ON support_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_session_id ON support_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_created_at ON support_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS (Row Level Security) for real-time subscriptions
ALTER TABLE support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_team ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for support_chat_sessions
CREATE POLICY "Users can view their own sessions"
  ON support_chat_sessions
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_agent_id);

CREATE POLICY "Users can create sessions"
  ON support_chat_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for support_chat_messages
CREATE POLICY "Users can view messages in their sessions"
  ON support_chat_messages
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM support_chat_sessions
      WHERE user_id = auth.uid() OR assigned_agent_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages"
  ON support_chat_messages
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM support_chat_sessions
      WHERE user_id = auth.uid() OR assigned_agent_id = auth.uid()
    )
  );

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for support_team
CREATE POLICY "Support team members can view team info"
  ON support_team
  FOR SELECT
  USING (true);
