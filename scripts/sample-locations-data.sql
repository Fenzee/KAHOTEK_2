-- Script untuk mengisi contoh data lokasi pengguna di Indonesia
-- Hanya untuk keperluan demo

-- Jakarta
UPDATE profiles 
SET 
  location = 'Jakarta, Indonesia',
  latitude = -6.2088,
  longitude = 106.8456
WHERE id = '00000000-0000-0000-0000-000000000001'
AND (latitude IS NULL OR longitude IS NULL);

-- Surabaya
UPDATE profiles 
SET 
  location = 'Surabaya, Jawa Timur, Indonesia',
  latitude = -7.2575,
  longitude = 112.7521
WHERE id = '00000000-0000-0000-0000-000000000002'
AND (latitude IS NULL OR longitude IS NULL);

-- Bandung
UPDATE profiles 
SET 
  location = 'Bandung, Jawa Barat, Indonesia',
  latitude = -6.9175,
  longitude = 107.6191
WHERE id = '00000000-0000-0000-0000-000000000003'
AND (latitude IS NULL OR longitude IS NULL);

-- Yogyakarta
UPDATE profiles 
SET 
  location = 'Yogyakarta, Indonesia',
  latitude = -7.7956,
  longitude = 110.3695
WHERE id = '00000000-0000-0000-0000-000000000004'
AND (latitude IS NULL OR longitude IS NULL);

-- Medan
UPDATE profiles 
SET 
  location = 'Medan, Sumatera Utara, Indonesia',
  latitude = 3.5952,
  longitude = 98.6722
WHERE id = '00000000-0000-0000-0000-000000000005'
AND (latitude IS NULL OR longitude IS NULL);

-- Makassar
UPDATE profiles 
SET 
  location = 'Makassar, Sulawesi Selatan, Indonesia',
  latitude = -5.1477,
  longitude = 119.4327
WHERE id = '00000000-0000-0000-0000-000000000006'
AND (latitude IS NULL OR longitude IS NULL);

-- Denpasar
UPDATE profiles 
SET 
  location = 'Denpasar, Bali, Indonesia',
  latitude = -8.6705,
  longitude = 115.2126
WHERE id = '00000000-0000-0000-0000-000000000007'
AND (latitude IS NULL OR longitude IS NULL);

-- Palembang
UPDATE profiles 
SET 
  location = 'Palembang, Sumatera Selatan, Indonesia',
  latitude = -2.9761,
  longitude = 104.7754
WHERE id = '00000000-0000-0000-0000-000000000008'
AND (latitude IS NULL OR longitude IS NULL);

-- Balikpapan
UPDATE profiles 
SET 
  location = 'Balikpapan, Kalimantan Timur, Indonesia',
  latitude = -1.2379,
  longitude = 116.8529
WHERE id = '00000000-0000-0000-0000-000000000009'
AND (latitude IS NULL OR longitude IS NULL);

-- Manado
UPDATE profiles 
SET 
  location = 'Manado, Sulawesi Utara, Indonesia',
  latitude = 1.4748,
  longitude = 124.8421
WHERE id = '00000000-0000-0000-0000-000000000010'
AND (latitude IS NULL OR longitude IS NULL);

-- Catatan: Ganti ID dengan ID pengguna yang sesuai di database Anda
-- Atau gunakan query berikut untuk mengupdate beberapa profil secara random:

/*
WITH random_users AS (
  SELECT id FROM profiles 
  ORDER BY random() 
  LIMIT 10
), locations AS (
  SELECT 
    'Jakarta, Indonesia' as loc, -6.2088 as lat, 106.8456 as lng UNION ALL
    SELECT 'Surabaya, Jawa Timur, Indonesia', -7.2575, 112.7521 UNION ALL
    SELECT 'Bandung, Jawa Barat, Indonesia', -6.9175, 107.6191 UNION ALL
    SELECT 'Yogyakarta, Indonesia', -7.7956, 110.3695 UNION ALL
    SELECT 'Medan, Sumatera Utara, Indonesia', 3.5952, 98.6722 UNION ALL
    SELECT 'Makassar, Sulawesi Selatan, Indonesia', -5.1477, 119.4327 UNION ALL
    SELECT 'Denpasar, Bali, Indonesia', -8.6705, 115.2126 UNION ALL
    SELECT 'Palembang, Sumatera Selatan, Indonesia', -2.9761, 104.7754 UNION ALL
    SELECT 'Balikpapan, Kalimantan Timur, Indonesia', -1.2379, 116.8529 UNION ALL
    SELECT 'Manado, Sulawesi Utara, Indonesia', 1.4748, 124.8421
)
UPDATE profiles p
SET 
  location = l.loc,
  latitude = l.lat,
  longitude = l.lng
FROM (
  SELECT 
    ru.id, 
    loc.loc, 
    loc.lat, 
    loc.lng,
    ROW_NUMBER() OVER() as rn
  FROM random_users ru
  CROSS JOIN LATERAL (SELECT loc, lat, lng FROM locations ORDER BY random() LIMIT 1) loc
) as l
WHERE p.id = l.id;
*/ 