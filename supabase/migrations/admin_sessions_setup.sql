-- Create Admin Sessions Tables (if they don't already exist)

-- Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token_hash VARCHAR(255) NOT NULL UNIQUE,
  obfuscated_path VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMP DEFAULT now()
);

-- Create indexes for admin_sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON admin_sessions(is_active);

-- Executive Sessions Table
CREATE TABLE IF NOT EXISTS executive_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token_hash VARCHAR(255) NOT NULL UNIQUE,
  obfuscated_path VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMP DEFAULT now()
);

-- Create indexes for executive_sessions
CREATE INDEX IF NOT EXISTS idx_executive_sessions_user_id ON executive_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_executive_sessions_expires_at ON executive_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_executive_sessions_is_active ON executive_sessions(is_active);

-- Enable RLS on admin_sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS admin_sessions_select ON admin_sessions;
DROP POLICY IF EXISTS admin_sessions_insert ON admin_sessions;
DROP POLICY IF EXISTS admin_sessions_delete ON admin_sessions;
DROP POLICY IF EXISTS admin_sessions_update ON admin_sessions;

-- Create RLS policies for admin_sessions
CREATE POLICY admin_sessions_select ON admin_sessions
  FOR SELECT USING (true);

CREATE POLICY admin_sessions_insert ON admin_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY admin_sessions_update ON admin_sessions
  FOR UPDATE USING (true);

CREATE POLICY admin_sessions_delete ON admin_sessions
  FOR DELETE USING (true);

-- Enable RLS on executive_sessions
ALTER TABLE executive_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS executive_sessions_select ON executive_sessions;
DROP POLICY IF EXISTS executive_sessions_insert ON executive_sessions;
DROP POLICY IF EXISTS executive_sessions_delete ON executive_sessions;
DROP POLICY IF EXISTS executive_sessions_update ON executive_sessions;

-- Create RLS policies for executive_sessions
CREATE POLICY executive_sessions_select ON executive_sessions
  FOR SELECT USING (true);

CREATE POLICY executive_sessions_insert ON executive_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY executive_sessions_update ON executive_sessions
  FOR UPDATE USING (true);

CREATE POLICY executive_sessions_delete ON executive_sessions
  FOR DELETE USING (true);
