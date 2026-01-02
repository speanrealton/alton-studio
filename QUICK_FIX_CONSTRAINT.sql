-- SIMPLER FIX: Just alter the CHECK constraint on existing user_roles table
-- Use this if you want to keep your existing data and just fix the constraint

-- Step 1: Drop the old check constraint
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Step 2: Add the new check constraint that includes 'user'
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('user', 'admin', 'executive', 'agent'));

-- Step 3: Now insert/update user roles for existing users
INSERT INTO public.user_roles (user_id, role, assigned_at, is_active)
SELECT id, 'user', CURRENT_TIMESTAMP, TRUE
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Verify
SELECT role, COUNT(*) FROM public.user_roles GROUP BY role;
