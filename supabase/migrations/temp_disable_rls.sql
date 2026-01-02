-- Disable RLS on submission tables for testing
-- This allows all authenticated users to read data for debugging

ALTER TABLE contributor_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE printer_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE design_submissions DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

