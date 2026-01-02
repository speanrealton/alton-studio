-- Fix RLS policy for contributors table to allow admin inserts
-- This allows the admin to create contributor profiles when approving applications

-- Disable RLS temporarily to modify policies
ALTER TABLE contributors DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "contributors_allow_select_public" ON contributors;
DROP POLICY IF EXISTS "contributors_allow_select_own" ON contributors;
DROP POLICY IF EXISTS "contributors_allow_insert_own" ON contributors;
DROP POLICY IF EXISTS "contributors_allow_update_own" ON contributors;
DROP POLICY IF EXISTS "contributors_admin_all" ON contributors;

-- Create policy allowing admins full access
CREATE POLICY "contributors_admin_all" ON contributors
  AS PERMISSIVE
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
      AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
      AND user_roles.is_active = true
    )
  );

-- Allow users to select their own profile
CREATE POLICY "contributors_select_own" ON contributors
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "contributors_update_own" ON contributors
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow public to see approved contributors
CREATE POLICY "contributors_select_public" ON contributors
  FOR SELECT
  USING (status = 'approved');

-- Allow users to insert their own profile (for self-service)
CREATE POLICY "contributors_insert_own" ON contributors
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
