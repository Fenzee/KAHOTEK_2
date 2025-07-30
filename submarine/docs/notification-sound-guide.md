# Panduan Suara Notifikasi

## Cara Menambahkan File Suara

1. Siapkan file suara dalam format MP3 (disarankan) atau format audio web lainnya (WAV/OGG)
2. Letakkan file di folder `public/sounds/` dengan nama yang sesuai, misal:
   - `notification.mp3` (default)
   - `chinese.mp3`
   - `Vine.mp3`
   - `Discord.mp3`
   
## Lokasi File dan Format

### Format yang Didukung
Aplikasi ini mendukung format audio berikut:
- MP3 (rekomendasi utama)
- WAV
- OGG

### Jalur File
File harus berada di direktori publik agar bisa diakses browser:
```
public/sounds/[nama-file].mp3
```

### Rekomendasi Ukuran
Untuk performa optimal, gunakan file audio yang:
- Berdurasi pendek (1-3 detik)
- Berukuran kecil (< 100KB)
- Memiliki kualitas yang cukup (128kbps untuk MP3 sudah memadai)

## Masalah Umum

### File Suara Tidak Terdeteksi
Jika muncul error "File suara tidak ditemukan", periksa:
1. File berada di lokasi yang tepat (`public/sounds/`)
2. Nama file cocok dengan yang didefinisikan dalam kode
3. Format file didukung oleh browser

### Suara Tidak Berfungsi pada Beberapa Browser
Beberapa browser memiliki kebijakan autoplay yang membatasi pemutaran audio sebelum interaksi pengguna. Pengguna mungkin perlu:
1. Berinteraksi dengan halaman terlebih dahulu (klik, ketik, dll)
2. Menyetel pengaturan browser untuk mengizinkan autoplay pada situs

### Sumber File Suara Gratis
Berikut beberapa sumber untuk mendapatkan file notifikasi gratis:
- [Mixkit](https://mixkit.co/free-sound-effects/notification/)
- [Notification Sounds](https://notificationsounds.com/)
- [Zedge](https://www.zedge.net/ringtones/notification)

## Menambahkan Suara Baru

Untuk menambahkan opsi suara notifikasi baru:

1. Tambahkan file suara ke direktori `public/sounds/`
2. Edit file `components/ui/chat-panel.tsx` dan temukan array `notificationSounds`
3. Tambahkan entri baru dengan format:
```js
{ id: 'id-unik', name: 'Nama Tampilan', path: '/sounds/nama-file.mp3' }
```

Contoh:
```js
const notificationSounds = [
  { id: 'default', name: 'Chime', path: '/sounds/notification.mp3' },
  { id: 'chime', name: 'Chinese', path: '/sounds/chinese.mp3' },
  { id: 'ding', name: 'Ding', path: '/sounds/Vine.mp3' },
  { id: 'bell', name: 'Discord', path: '/sounds/Discord.mp3' },
  { id: 'boop', name: 'Boop', path: '/sounds/boop.mp3' }, // Suara baru
  { id: 'none', name: 'Tidak Ada', path: '' }
];
``` 