-- Add email column to team_members table if it doesn't exist
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Add user_id column if it doesn't exist (for linking to auth.users)
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;
