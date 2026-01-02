-- Create admins table for managing admin users
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on printers table if not already enabled
ALTER TABLE IF EXISTS public.printers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can update printer status" ON public.printers;
DROP POLICY IF EXISTS "Printers can update own profile" ON public.printers;
DROP POLICY IF EXISTS "Public can view approved printers" ON public.printers;
DROP POLICY IF EXISTS "Users can view all printers" ON public.printers;
DROP POLICY IF EXISTS "Admins can view own profile" ON public.admins;

-- Allow admins to update printer status
CREATE POLICY "Admins can update printer status" ON public.printers
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Allow printers to update their own profile (except status)
CREATE POLICY "Printers can update own profile" ON public.printers
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow all users to view approved printers
CREATE POLICY "Public can view approved printers" ON public.printers
  FOR SELECT USING (status = 'approved');

-- Allow printers to view their own profile
CREATE POLICY "Printers can view own profile" ON public.printers
  FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to view all printers (for admin dashboard)
CREATE POLICY "Admins can view all printers" ON public.printers
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Allow admins to view their own profile
CREATE POLICY "Admins can view own profile" ON public.admins
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_printers_status ON public.printers(status);
CREATE INDEX IF NOT EXISTS idx_printers_user_id ON public.printers(user_id);
CREATE INDEX IF NOT EXISTS idx_printers_created_at ON public.printers(created_at);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- Enable realtime for printers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.printers;
