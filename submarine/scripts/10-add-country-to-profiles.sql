-- Script to add country column to profiles table
-- This adds support for country information in user profiles

-- Add country column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Add school column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school TEXT;

-- Add phone column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add birthdate column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Add address columns to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add comments to the columns
COMMENT ON COLUMN public.profiles.country IS 'User country code (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN public.profiles.school IS 'User school or institution name';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number (optional)';
COMMENT ON COLUMN public.profiles.birthdate IS 'User birth date for age calculation';
COMMENT ON COLUMN public.profiles.address IS 'User full address';
COMMENT ON COLUMN public.profiles.latitude IS 'Latitude coordinate of user address';
COMMENT ON COLUMN public.profiles.longitude IS 'Longitude coordinate of user address';

-- No need to update policies as existing ones already cover the new columns
-- The policy "Users can update their own profile" already allows users to update their profiles

-- Grant permissions
GRANT ALL ON public.profiles TO service_role;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles (country);
CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles (school);
CREATE INDEX IF NOT EXISTS idx_profiles_birthdate ON public.profiles (birthdate);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (latitude, longitude);

COMMIT; 