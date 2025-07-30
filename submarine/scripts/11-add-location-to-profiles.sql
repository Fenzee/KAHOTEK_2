-- Tambahkan kolom lokasi ke tabel profiles
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Tambahkan komentar pada kolom
COMMENT ON COLUMN public.profiles.location IS 'Alamat atau lokasi pengguna dalam bentuk teks';
COMMENT ON COLUMN public.profiles.latitude IS 'Garis lintang lokasi pengguna';
COMMENT ON COLUMN public.profiles.longitude IS 'Garis bujur lokasi pengguna';

-- Update kebijakan RLS untuk mengizinkan update kolom lokasi
-- Periksa apakah policy sudah ada sebelum mencoba membuat yang baru
DO $$
BEGIN
  -- Periksa apakah policy sudah ada
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Pengguna dapat memperbarui lokasi mereka sendiri'
  ) THEN
    -- Buat policy jika belum ada
    CREATE POLICY "Pengguna dapat memperbarui lokasi mereka sendiri" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Buat index untuk pencarian spasial yang efisien (opsional)
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON public.profiles (latitude, longitude); 