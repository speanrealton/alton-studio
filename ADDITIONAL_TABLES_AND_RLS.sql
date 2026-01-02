-- Additional tables for role-based support system
-- Run this in Supabase SQL Editor after CREATE_SUPPORT_TABLES.sql

-- If user_profiles table doesn't exist, create it
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'user', 'agent', 'admin'
  status TEXT DEFAULT 'active', -- 'active', 'suspended', 'deleted'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure user_profiles has all required columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    ALTER TABLE user_profiles 
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
    ALTER TABLE user_profiles 
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    ALTER TABLE user_profiles 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    ALTER TABLE user_profiles 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    
    -- Add UNIQUE constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.constraint_column_usage 
      WHERE table_name = 'user_profiles' AND column_name = 'user_id' 
      AND constraint_name LIKE '%user_id%'
    ) THEN
      ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
    END IF;
  END IF;
END $$;

-- Create agents table as alias/view of support_team if it doesn't exist
-- (support_team is created in CREATE_SUPPORT_TABLES.sql)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  status TEXT DEFAULT 'available',
  assigned_chats INT DEFAULT 0,
  chats_resolved INT DEFAULT 0,
  avg_response_time INT,
  customer_satisfaction FLOAT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure agents table has UNIQUE constraint on user_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') THEN
    -- Add UNIQUE constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.constraint_column_usage 
      WHERE table_name = 'agents' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE agents ADD CONSTRAINT agents_user_id_unique UNIQUE (user_id);
    END IF;
  END IF;
END $$;

-- If support_team exists, we'll use it; if agents exists, we'll use that
-- Ensure support_team has all the columns it needs
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_team') THEN
    ALTER TABLE support_team 
    ADD COLUMN IF NOT EXISTS assigned_chats INT DEFAULT 0;
    ALTER TABLE support_team 
    ADD COLUMN IF NOT EXISTS chats_resolved INT DEFAULT 0;
    ALTER TABLE support_team 
    ADD COLUMN IF NOT EXISTS avg_response_time INT;
    ALTER TABLE support_team 
    ADD COLUMN IF NOT EXISTS customer_satisfaction FLOAT;
    ALTER TABLE support_team 
    ADD COLUMN IF NOT EXISTS notes TEXT;
  END IF;
END $$;

-- Create support_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create support_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES user_profiles(user_id),
  auto_reply_message TEXT,
  max_concurrent_chats INT DEFAULT 5,
  agent_assignment_type TEXT DEFAULT 'least-busy', -- 'round-robin', 'least-busy', 'manual'
  working_hours_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create chat_ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES support_chat_sessions(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  rated_by UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL, -- 'chat_created', 'chat_accepted', 'message_sent', 'chat_closed', etc.
  details JSONB,
  resource_type TEXT, -- 'chat', 'agent', 'user', 'setting'
  resource_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_support_categories_active ON support_categories(active);
CREATE INDEX IF NOT EXISTS idx_chat_ratings_session_id ON chat_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_ratings_created_at ON chat_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Update RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only service role can modify profiles" ON user_profiles;
CREATE POLICY "Only service role can modify profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only service role can update profiles" ON user_profiles;
CREATE POLICY "Only service role can update profiles"
  ON user_profiles
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Update RLS policies for agents/support_team
DO $$ 
BEGIN
  -- Handle agents table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') THEN
    ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Agents can view their own details" ON agents;
    CREATE POLICY "Agents can view their own details"
      ON agents
      FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins can view all agents" ON agents;
    CREATE POLICY "Admins can view all agents"
      ON agents
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
  
  -- Handle support_team table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_team') THEN
    ALTER TABLE support_team ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Support team can view their own details" ON support_team;
    CREATE POLICY "Support team can view their own details"
      ON support_team
      FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins can view all support team" ON support_team;
    CREATE POLICY "Admins can view all support team"
      ON support_team
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Update RLS policies for support_settings
ALTER TABLE support_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view settings" ON support_settings;
CREATE POLICY "Admins can view settings"
  ON support_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Update RLS policies for chat_ratings
ALTER TABLE chat_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and create ratings for their chats" ON chat_ratings;
CREATE POLICY "Users can view and create ratings for their chats"
  ON chat_ratings
  FOR SELECT
  USING (
    rated_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE id = session_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create ratings" ON chat_ratings;
CREATE POLICY "Users can create ratings"
  ON chat_ratings
  FOR INSERT
  WITH CHECK (rated_by = auth.uid());

-- Update RLS policies for activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default support categories
INSERT INTO support_categories (name, description, icon) VALUES
  ('Billing & Payments', 'Questions about billing, payments, and invoices', '💳'),
  ('Technical Issues', 'Technical problems and troubleshooting', '⚙️'),
  ('Orders & Shipping', 'Questions about orders and shipping status', '📦'),
  ('Design Tools', 'Questions about design features and tools', '🎨'),
  ('Account & Profile', 'Account settings and profile management', '👤'),
  ('Other', 'Other inquiries', '❓')
ON CONFLICT (name) DO NOTHING;

-- Grant appropriate permissions
GRANT SELECT ON support_categories TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON agents TO authenticated;
GRANT SELECT ON support_settings TO authenticated;
GRANT SELECT ON chat_ratings TO authenticated;
GRANT INSERT ON chat_ratings TO authenticated;
GRANT SELECT ON activity_logs TO authenticated;
