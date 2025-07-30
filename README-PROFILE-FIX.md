# Panduan Perbaikan Profile dan Google OAuth

## Masalah yang Diperbaiki

### 1. Foreign Key Constraint Error
**Masalah**: `insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"`

**Penyebab**: Tabel `profiles` tidak memiliki kolom `fullname` yang dibutuhkan oleh aplikasi.

**Solusi**: 
1. Jalankan script SQL baru: `12-add-fullname-to-profiles.sql`
2. Script ini menambahkan kolom `fullname` ke tabel `profiles`

```sql
-- Jalankan di Supabase SQL Editor
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fullname TEXT;
```

### 2. Google OAuth Redirect ke Localhost
**Masalah**: Setelah login dengan Google, aplikasi mengarah ke `http://localhost:3000/auth/callback` meskipun sudah di-deploy di Vercel.

**Penyebab**: URL redirect yang hardcoded ke `window.location.origin` tidak mempertimbangkan environment production.

**Solusi**: 
- Diperbarui kode di `app/auth/register/page.tsx` dan `app/auth/login/page.tsx`
- Menggunakan logic conditional berdasarkan environment:
  ```javascript
  redirectTo: `${process.env.NODE_ENV === 'production' 
    ? `https://${window.location.hostname}` 
    : window.location.origin}/auth/callback`
  ```

## Langkah-langkah Deployment

### 1. Update Database Schema
Jalankan script SQL berikut di Supabase:

```sql
-- File: scripts/12-add-fullname-to-profiles.sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fullname TEXT;
COMMENT ON COLUMN public.profiles.fullname IS 'User full name';
GRANT ALL ON public.profiles TO service_role;
CREATE INDEX IF NOT EXISTS idx_profiles_fullname ON public.profiles (fullname);
```

### 2. Konfigurasi Google OAuth di Supabase
1. Buka Supabase Dashboard → Authentication → Providers
2. Konfigurasi Google OAuth:
   - **Site URL**: `https://your-domain.vercel.app`
   - **Redirect URLs**: `https://your-domain.vercel.app/auth/callback`

### 3. Deploy ke Vercel
1. Push perubahan ke repository
2. Vercel akan otomatis melakukan redeploy
3. Test login dengan Google di production

## Testing

### Test Register Baru
1. Buka halaman register
2. Isi semua field termasuk nama lengkap
3. Submit form
4. Pastikan tidak ada error foreign key constraint

### Test Google OAuth
1. Klik "Masuk dengan Google" di production
2. Lakukan autentikasi Google
3. Pastikan redirect ke `/dashboard` dan bukan ke localhost

## Troubleshooting

### Jika Masih Ada Error Foreign Key
1. Pastikan script SQL sudah dijalankan dengan benar
2. Cek struktur tabel `profiles` di Supabase:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' AND table_schema = 'public';
   ```

### Jika Google OAuth Masih Redirect ke Localhost
1. Clear cache browser
2. Pastikan environment variable `NODE_ENV` terdeteksi sebagai 'production'
3. Cek konfigurasi Google OAuth di Supabase Dashboard

## Status Update
- ✅ Kolom `fullname` ditambahkan ke schema database
- ✅ Google OAuth redirect diperbaiki untuk production
- ✅ Kode register dan login diperbarui
- ✅ Dokumentasi lengkap dibuat