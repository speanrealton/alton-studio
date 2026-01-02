-- IMMEDIATE FIX: Add existing user to user_roles as 'user' role
-- Run this SQL in Supabase SQL editor if the trigger hasn't been applied yet

-- Step 1: Check if the user_roles table exists and has the 'user' role option
-- This should succeed if the migration has been applied
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_roles';

-- Step 2: Check your user's ID
-- Replace 'your-email@example.com' with your actual email
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Step 3: Add the 'user' role (copy your user ID from Step 2 and replace the UUID below)
INSERT INTO public.user_roles (user_id, role, assigned_at, is_active)
VALUES ('YOUR-USER-ID-HERE', 'user', CURRENT_TIMESTAMP, TRUE)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Verify the role was added
SELECT * FROM public.user_roles 
WHERE user_id = 'YOUR-USER-ID-HERE';

-- ===============================================
-- TO PROMOTE USER TO ADMIN (optional):
-- ===============================================
-- Insert admin role for the user (copy your user ID and replace the UUID)
INSERT INTO public.user_roles (user_id, role, assigned_at, is_active)
VALUES ('YOUR-USER-ID-HERE', 'admin', CURRENT_TIMESTAMP, TRUE)
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify admin role was added
SELECT * FROM public.user_roles 
WHERE user_id = 'YOUR-USER-ID-HERE' AND role = 'admin';
