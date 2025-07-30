# Notification Sound Setup Guide

## Lokasi File Suara
Semua file suara notifikasi harus ditempatkan di folder berikut:
```
public/sounds/
```

## Format File yang Didukung
Untuk kompatibilitas maksimal, gunakan format berikut:
- MP3 (direkomendasikan)
- WAV 
- OGG

## File Suara Default
Aplikasi ini sudah dikonfigurasi untuk menggunakan file-file suara berikut:

1. **Default**: `/sounds/notification-default.mp3`
2. **Bell**: `/sounds/notification-bell.mp3`
3. **Chime**: `/sounds/notification-chime.mp3`
4. **Ding**: `/sounds/notification-ding.mp3`

Silakan ganti file-file placeholder di direktori tersebut dengan file suara yang sebenarnya.

## Panduan Pemilihan Suara
Untuk pengalaman pengguna yang optimal:

- Pilih suara yang singkat (1-2 detik)
- Gunakan suara yang jelas dan mudah dikenali
- Pastikan volume suara konsisten
- Hindari suara yang terlalu keras atau mengganggu

## Menambahkan Suara Notifikasi Baru

Jika ingin menambahkan pilihan suara notifikasi baru:

1. Tambahkan file suara baru di folder `/public/sounds/` dengan format yang konsisten:
   ```
   notification-[nama-suara].mp3
   ```

2. Edit file `components/ui/chat-panel.tsx` untuk menambahkan opsi suara baru:
   ```typescript
   // Temukan array notificationSounds
   const notificationSounds = [
     // Suara yang sudah ada...
     { id: 'nama-suara-baru', name: 'Nama Tampilan', path: '/sounds/notification-nama-suara-baru.mp3' },
   ];
   ```

## Perhatian

1. **Ukuran File**: Pastikan file suara memiliki ukuran yang kecil (idealnya < 100KB) untuk memastikan kecepatan load yang optimal.

2. **Hak Cipta**: Gunakan hanya suara yang Anda miliki haknya atau yang berlisensi bebas (seperti Creative Commons).

3. **Browser Support**: Beberapa browser mungkin memiliki pembatasan memutar suara sebelum pengguna berinteraksi dengan halaman. Ini adalah perilaku normal untuk keamanan pengguna. 