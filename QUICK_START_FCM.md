# 🚀 Quick Start - Firebase FCM

Panduan cepat untuk menjalankan fitur FCM notifikasi.

## ⚡ Setup Cepat (5 Menit)

### 1. Dapatkan Firebase Server Key

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Project Settings → Cloud Messaging
4. Scroll ke "Cloud Messaging API (Legacy)"
5. Copy "Server key"

### 2. Setup Backend

```bash
cd administrasi

# Tambahkan ke .env
echo "FIREBASE_SERVER_KEY=your-server-key-here" >> .env

# Run migration
php artisan migrate

# Test
php artisan tinker
```

Di tinker:
```php
$fcm = app(\App\Services\FCMService::class);
echo "FCM Service Ready!";
exit
```

### 3. Setup Mobile App

```bash
cd administrasi_mobile

# Download google-services.json dari Firebase Console
# (Android App Settings → Download google-services.json)
# Pindahkan ke: android/app/google-services.json

# Install dependencies
flutter pub get

# Run app
flutter run
```

### 4. Test Broadcast

1. Jalankan web app: `php artisan serve`
2. Login ke aplikasi
3. Akses `/announcements/create`
4. Isi form dan klik **Kirim Pengumuman**
5. Cek notifikasi di mobile app

## ✅ Verifikasi Setup

### Backend Check
```bash
cd administrasi

# Check .env has server key
grep FIREBASE_SERVER_KEY .env

# Check migrations
php artisan migrate:status | grep fcm
```

### Mobile Check
```bash
cd administrasi_mobile

# Check file exists
ls -l android/app/google-services.json

# Check dependencies
flutter pub deps | grep firebase
```

## 🎯 Akses Fitur

- **Broadcast Pengumuman:** http://localhost:8000/announcements/create
- **Daftar Pengumuman:** http://localhost:8000/announcements

## 📚 Dokumentasi Lengkap

Lihat file `FIREBASE_FCM_SETUP.md` untuk panduan detail.

## ⚠️ Troubleshooting

**Error: Server key not configured**
```bash
# Tambahkan ke .env
echo "FIREBASE_SERVER_KEY=your-actual-server-key" >> .env

# Restart server
php artisan serve
```

**Flutter: MissingPluginException**
```bash
flutter clean
flutter pub get
flutter run
```

**Notifikasi tidak sampai**
1. Cek FCM token tersimpan di database: `SELECT * FROM fcm_tokens;`
2. Cek logs Laravel: `tail -f storage/logs/laravel.log`
3. Cek internet connection
4. Cek Server Key valid di Firebase Console

## 💡 Tips

- Token FCM di-refresh otomatis oleh SDK
- Invalid token otomatis dihapus dari database
- Gunakan type "urgent" untuk notifikasi penting
- Statistik bisa dilihat di detail pengumuman

---

**Support:** Cek `FIREBASE_FCM_SETUP.md` untuk troubleshooting lengkap
