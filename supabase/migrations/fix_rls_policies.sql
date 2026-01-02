-- Fix RLS policies to work correctly
-- The issue is the 'is_active' check may be failing. Simplify to just check role

-- ========================================
-- CONTRIBUTOR APPLICATIONS - UPDATED POLICIES
-- ========================================

DROP POLICY IF EXISTS contributor_applications_admin_select ON contributor_applications;
DROP POLICY IF EXISTS contributor_applications_admin_update ON contributor_applications;

CREATE POLICY contributor_applications_admin_select ON contributor_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY contributor_applications_admin_update ON contributor_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'executive')
    )
  );

-- ========================================
-- PRINTER SUBMISSIONS - UPDATED POLICIES
-- ========================================

DROP POLICY IF EXISTS printer_submissions_admin_select ON printer_submissions;
DROP POLICY IF EXISTS printer_submissions_admin_update ON printer_submissions;

CREATE POLICY printer_submissions_admin_select ON printer_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY printer_submissions_admin_update ON printer_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'executive')
    )
  );

-- ========================================
-- DESIGN SUBMISSIONS - UPDATED POLICIES  
-- ========================================

DROP POLICY IF EXISTS design_submissions_admin_select ON design_submissions;
DROP POLICY IF EXISTS design_submissions_admin_update ON design_submissions;

CREATE POLICY design_submissions_admin_select ON design_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY design_submissions_admin_update ON design_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'executive')
    )
  );

