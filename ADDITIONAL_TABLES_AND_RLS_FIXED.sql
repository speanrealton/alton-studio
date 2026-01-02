-- ADDITIONAL TABLES & ROLE-BASED SECURITY
-- Run this AFTER CREATE_SUPPORT_TABLES.sql has been executed
-- This adds role-based access control and support features

-- ========================================
-- 1. USER PROFILES TABLE (Role Management)
-- ========================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ========================================
-- 2. SUPPORT CATEGORIES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS support_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_categories_active ON support_categories(active);

ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can read categories" ON support_categories
  FOR SELECT USING (TRUE);

-- ========================================
-- 3. SUPPORT SETTINGS TABLE (Admin Config)
-- ========================================

CREATE TABLE IF NOT EXISTS support_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES user_profiles(user_id),
  auto_reply_message TEXT,
  max_concurrent_chats INT DEFAULT 5,
  agent_assignment_type TEXT DEFAULT 'least-busy',
  working_hours_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE support_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins view settings" ON support_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ========================================
-- 4. CHAT RATINGS TABLE (User Satisfaction)
-- ========================================

CREATE TABLE IF NOT EXISTS chat_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES support_chat_sessions(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  rated_by UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_ratings_session_id ON chat_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_ratings_created_at ON chat_ratings(created_at);

ALTER TABLE chat_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users rate their chats" ON chat_ratings
  FOR SELECT USING (rated_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY IF NOT EXISTS "Users insert ratings" ON chat_ratings
  FOR INSERT WITH CHECK (rated_by = auth.uid());

-- ========================================
-- 5. ACTIVITY LOGS TABLE (Audit Trail)
-- ========================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  resource_type TEXT,
  resource_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins view logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ========================================
-- 6. AGENTS TABLE (Support Staff)
-- ========================================

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  role TEXT,
  status TEXT DEFAULT 'available',
  assigned_chats INT DEFAULT 0,
  chats_resolved INT DEFAULT 0,
  avg_response_time INT,
  customer_satisfaction FLOAT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Agents view themselves" ON agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins view all agents" ON agents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ========================================
-- 7. INSERT DEFAULT SUPPORT CATEGORIES
-- ========================================

INSERT INTO support_categories (name, description, icon) VALUES
  ('Billing & Payments', 'Questions about billing, payments, and invoices', '💳'),
  ('Technical Issues', 'Technical problems and troubleshooting', '⚙️'),
  ('Orders & Shipping', 'Questions about orders and shipping status', '📦'),
  ('Design Tools', 'Questions about design features and tools', '🎨'),
  ('Account & Profile', 'Account settings and profile management', '👤'),
  ('Other', 'Other inquiries', '❓')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 8. GRANT PERMISSIONS
-- ========================================

GRANT SELECT ON support_categories TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON agents TO authenticated;
GRANT SELECT ON support_settings TO authenticated;
GRANT SELECT ON chat_ratings TO authenticated;
GRANT INSERT ON chat_ratings TO authenticated;
GRANT SELECT ON activity_logs TO authenticated;

-- ========================================
-- SETUP COMPLETE ✅
-- ========================================
-- 
-- Next steps:
-- 1. Add your user to user_profiles with role='admin'
-- 2. Add agent users with role='agent'
-- 3. Test the system with different user types
--
-- Example:
-- INSERT INTO user_profiles (user_id, role, status) 
-- VALUES ('your-user-id', 'admin', 'active');
--
