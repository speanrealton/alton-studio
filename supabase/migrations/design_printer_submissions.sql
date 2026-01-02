-- Design & Printer Submissions Tables with RLS
-- This migration creates the design_submissions and printer_submissions tables

-- ========================================
-- 1. DESIGN SUBMISSIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS design_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  designer_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  thumbnail_url TEXT,
  file_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_design_submissions_user_id ON design_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_design_submissions_status ON design_submissions(status);
CREATE INDEX IF NOT EXISTS idx_design_submissions_submitted_at ON design_submissions(submitted_at DESC);

ALTER TABLE design_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own designs
CREATE POLICY design_submissions_insert ON design_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own designs
CREATE POLICY design_submissions_user_select ON design_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all designs
CREATE POLICY design_submissions_admin_select ON design_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Users can update their own designs (only if pending)
CREATE POLICY design_submissions_user_update ON design_submissions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Admins can update design status
CREATE POLICY design_submissions_admin_update ON design_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- ========================================
-- 2. PRINTER SUBMISSIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS printer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  website TEXT,
  service_types TEXT[],
  years_in_business INT,
  eco_certified BOOLEAN DEFAULT FALSE,
  iso_certified BOOLEAN DEFAULT FALSE,
  portfolio_urls TEXT[],
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_printer_submissions_user_id ON printer_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_printer_submissions_status ON printer_submissions(status);
CREATE INDEX IF NOT EXISTS idx_printer_submissions_submitted_at ON printer_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_printer_submissions_email ON printer_submissions(email);

ALTER TABLE printer_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert printer submissions
CREATE POLICY printer_submissions_insert ON printer_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY printer_submissions_user_select ON printer_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY printer_submissions_admin_select ON printer_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Users can update their own submissions (only if pending)
CREATE POLICY printer_submissions_user_update ON printer_submissions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Admins can update submission status
CREATE POLICY printer_submissions_admin_update ON printer_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- ========================================
-- 3. CONTRIBUTOR APPLICATIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS contributor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT,
  portfolio_url TEXT,
  experience_level TEXT NOT NULL DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  design_categories TEXT[],
  sample_works TEXT[],
  sample_files JSONB[],
  why_join TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contributor_applications_user_id ON contributor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_contributor_applications_status ON contributor_applications(status);
CREATE INDEX IF NOT EXISTS idx_contributor_applications_created_at ON contributor_applications(created_at DESC);

ALTER TABLE contributor_applications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own application
CREATE POLICY contributor_applications_insert ON contributor_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own application
CREATE POLICY contributor_applications_user_select ON contributor_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY contributor_applications_admin_select ON contributor_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Admins can update applications
CREATE POLICY contributor_applications_admin_update ON contributor_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- ========================================
-- 4. CONTRIBUTORS TABLE (For Approved Contributors)
-- ========================================

CREATE TABLE IF NOT EXISTS contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  display_name TEXT NOT NULL,
  portfolio_url TEXT,
  approved_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contributors_user_id ON contributors(user_id);
CREATE INDEX IF NOT EXISTS idx_contributors_status ON contributors(status);

ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

-- Contributors can view their own profile
CREATE POLICY contributors_select ON contributors
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all contributors
CREATE POLICY contributors_admin_select ON contributors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Admins can update contributors
CREATE POLICY contributors_admin_update ON contributors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- ========================================
-- 5. GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE ON design_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON printer_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON contributor_applications TO authenticated;
GRANT SELECT, UPDATE ON contributors TO authenticated;

-- ========================================
-- MIGRATION COMPLETE ✅
-- ========================================
