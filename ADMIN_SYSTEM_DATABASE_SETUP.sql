-- Admin & Executive System Database Setup

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'executive', 'agent')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Admin Sessions Table (Encrypted)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  obfuscated_path TEXT UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Executive Sessions Table (Encrypted)
CREATE TABLE IF NOT EXISTS executive_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  obfuscated_path TEXT UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_executive_sessions_user_id ON executive_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_executive_sessions_expires_at ON executive_sessions(expires_at);

-- Admin Permissions Table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('approve_designs', 'approve_printers', 'manage_team', 'manage_settings', 'view_logs')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id ON admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_permission ON admin_permissions(permission);

-- Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_user_id ON admin_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_timestamp ON admin_activity_logs(timestamp DESC);

-- Admin Access Logs Table (For Audit Trail)
CREATE TABLE IF NOT EXISTS admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  path TEXT,
  accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_access_logs_user_id ON admin_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_accessed_at ON admin_access_logs(accessed_at DESC);

-- Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL CHECK (type IN ('design_pending', 'printer_pending', 'alert', 'info')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id ON admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);

-- Two-Factor Authentication Table
CREATE TABLE IF NOT EXISTS user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  secret TEXT NOT NULL, -- Encrypted
  enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[], -- Encrypted array of backup codes
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  team_lead_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_teams_team_lead_id ON teams(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('agent', 'team_lead')),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  approvals_count INTEGER DEFAULT 0,
  UNIQUE(user_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(is_active);

-- Approval Metrics Table
CREATE TABLE IF NOT EXISTS approval_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  designs_submitted INTEGER DEFAULT 0,
  designs_approved INTEGER DEFAULT 0,
  designs_rejected INTEGER DEFAULT 0,
  printers_submitted INTEGER DEFAULT 0,
  printers_approved INTEGER DEFAULT 0,
  printers_rejected INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approval_metrics_date ON approval_metrics(date DESC);

-- RLS (Row-Level Security) Policies for Admin System

-- Admin Sessions RLS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_sessions_select ON admin_sessions;
CREATE POLICY admin_sessions_select ON admin_sessions
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS admin_sessions_insert ON admin_sessions;
CREATE POLICY admin_sessions_insert ON admin_sessions
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS admin_sessions_delete ON admin_sessions;
CREATE POLICY admin_sessions_delete ON admin_sessions
  FOR DELETE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Executive Sessions RLS
ALTER TABLE executive_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS executive_sessions_select ON executive_sessions;
CREATE POLICY executive_sessions_select ON executive_sessions
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS executive_sessions_insert ON executive_sessions;
CREATE POLICY executive_sessions_insert ON executive_sessions
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS executive_sessions_delete ON executive_sessions;
CREATE POLICY executive_sessions_delete ON executive_sessions
  FOR DELETE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- User Roles RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_roles_select ON user_roles;
CREATE POLICY user_roles_select ON user_roles
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Admin Activity Logs RLS
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_activity_logs_select ON admin_activity_logs;
CREATE POLICY admin_activity_logs_select ON admin_activity_logs
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role IN ('admin', 'executive')
    )
  );
DROP POLICY IF EXISTS admin_activity_logs_insert ON admin_activity_logs;
CREATE POLICY admin_activity_logs_insert ON admin_activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin Access Logs RLS
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_access_logs_select ON admin_access_logs;
CREATE POLICY admin_access_logs_select ON admin_access_logs
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role IN ('admin', 'executive')
    )
  );
DROP POLICY IF EXISTS admin_access_logs_insert ON admin_access_logs;
CREATE POLICY admin_access_logs_insert ON admin_access_logs
  FOR INSERT WITH CHECK (true);

-- Team Members RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_members_select ON team_members;
CREATE POLICY team_members_select ON team_members
  FOR SELECT USING (
    auth.uid() = user_id 
    OR auth.uid() IN (SELECT team_lead_id FROM teams WHERE id = team_id)
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role = 'executive')
  );
