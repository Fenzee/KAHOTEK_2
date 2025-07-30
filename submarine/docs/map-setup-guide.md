# Panduan Konfigurasi Peta dan Lokasi Pengguna

Dokumen ini menjelaskan cara mengatur fitur peta dan lokasi pengguna pada aplikasi GolekQuiz.

## Konfigurasi Supabase

### 1. Menambahkan kolom lokasi ke tabel profiles

Jalankan SQL berikut pada SQL Editor di Supabase:

```sql
-- Tambahkan kolom lokasi ke tabel profiles
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Tambahkan komentar pada kolom
COMMENT ON COLUMN public.profiles.location IS 'Alamat atau lokasi pengguna dalam bentuk teks';
COMMENT ON COLUMN public.profiles.latitude IS 'Garis lintang lokasi pengguna';
COMMENT ON COLUMN public.profiles.longitude IS 'Garis bujur lokasi pengguna';

-- Buat index untuk pencarian spasial yang efisien (opsional)
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON public.profiles (latitude, longitude);
```

### 2. Membuat RLS Policy untuk kolom lokasi

Jalankan SQL berikut untuk menambahkan kebijakan RLS untuk lokasi:

```sql
-- Periksa apakah policy sudah ada
BEGIN;
  -- Buat policy untuk update lokasi
  CREATE POLICY "Pengguna dapat memperbarui lokasi mereka sendiri" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);
COMMIT;
```

Jika muncul error bahwa policy sudah ada, Anda bisa mengabaikannya.

### 3. Konfigurasi API Geocoding

Untuk menggunakan fitur pencarian dan konversi alamat menjadi koordinat, Anda perlu mengatur API OpenCage Geocoding:

1. Daftar akun di [OpenCage](https://opencagedata.com/)
2. Dapatkan API key dari dashboard OpenCage
3. Tambahkan API key ke environment variables Supabase:
   - Buka Supabase Dashboard > Project Settings > Environment Variables
   - Tambahkan variable: `OPENCAGE_API_KEY = your_api_key_here`

## Pengujian

Untuk memastikan fitur lokasi bekerja dengan baik:

1. Login ke aplikasi
2. Buka halaman profil dan isi alamat
3. Cek apakah alamat muncul di peta
4. Buka Dashboard untuk melihat peta sebaran pengguna di Indonesia

## Struktur Tabel

### Tabel profiles

| Kolom     | Tipe Data        | Deskripsi                       |
|-----------|------------------|--------------------------------|
| id        | UUID             | Primary key, dari auth.users   |
| username  | TEXT             | Username pengguna              |
| email     | TEXT             | Email pengguna                 |
| avatar_url| TEXT             | URL avatar pengguna            |
| location  | TEXT             | Alamat lengkap dalam teks      |
| latitude  | DOUBLE PRECISION | Koordinat garis lintang        |
| longitude | DOUBLE PRECISION | Koordinat garis bujur          |
| ...       | ...              | Kolom lainnya                  |

## Troubleshooting

### Error "Policy already exists"

Jika Anda melihat error bahwa policy sudah ada, coba periksa policy yang ada:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Error "Column already exists"

Jika Anda melihat error bahwa kolom sudah ada, Anda bisa melewati langkah 1.

### Data tidak muncul di peta

Pastikan:
1. Kolom latitude dan longitude tidak NULL
2. Nilai latitude dan longitude valid (lat: -90 to 90, lng: -180 to 180)
3. Pengguna memiliki izin RLS yang sesuai 