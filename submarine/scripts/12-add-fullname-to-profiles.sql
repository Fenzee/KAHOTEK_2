-- Script to add fullname column to profiles table
-- This adds support for full name information in user profiles

-- Add fullname column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fullname TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.profiles.fullname IS 'User full name';

-- Grant permissions
GRANT ALL ON public.profiles TO service_role;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_fullname ON public.profiles (fullname);

COMMIT;