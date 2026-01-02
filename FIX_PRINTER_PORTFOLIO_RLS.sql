-- Fix RLS policy for printer_portfolio table to allow admins and printers to see portfolio images

-- Disable RLS temporarily to modify policies
ALTER TABLE printer_portfolio DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE printer_portfolio ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "printer_portfolio_admin_all" ON printer_portfolio;
DROP POLICY IF EXISTS "printer_portfolio_printer_own" ON printer_portfolio;
DROP POLICY IF EXISTS "printer_portfolio_select_public" ON printer_portfolio;

-- Create policy allowing admins full access
CREATE POLICY "printer_portfolio_admin_all" ON printer_portfolio
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

-- Allow printers to see and insert their own portfolio images
CREATE POLICY "printer_portfolio_printer_own" ON printer_portfolio
  FOR ALL
  USING (
    printer_id IN (
      SELECT id FROM printers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    printer_id IN (
      SELECT id FROM printers WHERE user_id = auth.uid()
    )
  );

-- Allow public to see portfolio images from approved printers
CREATE POLICY "printer_portfolio_select_public" ON printer_portfolio
  FOR SELECT
  USING (
    printer_id IN (
      SELECT id FROM printers WHERE status = 'approved'
    )
  );
