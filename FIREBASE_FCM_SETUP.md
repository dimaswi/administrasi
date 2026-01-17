# Panduan Implementasi Firebase Cloud Messaging (FCM)

## 📋 Daftar Isi
1. [Persiapan Firebase Project](#persiapan-firebase-project)
2. [Setup Backend (Laravel)](#setup-backend-laravel)
3. [Setup Frontend (React/Inertia)](#setup-frontend-reactinertia)
4. [Setup Mobile App (Flutter)](#setup-mobile-app-flutter)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Persiapan Firebase Project

### 1. Buat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **Add Project** atau **Create a Project**
3. Masukkan nama project: `HRAdministrasi` (atau sesuai kebutuhan)
4. Ikuti wizard setup hingga selesai

### 2. Setup untuk Android (Flutter)

1. Di Firebase Console, klik **Add app** → **Android**
2. Masukkan package name: `com.example.administrasi_mobile` (sesuaikan dengan package Anda)
3. Download file `google-services.json`
4. Simpan file tersebut ke:
   ```
   administrasi_mobile/android/app/google-services.json
   ```

5. Edit `administrasi_mobile/android/build.gradle.kts`:
   ```kotlin
   buildscript {
       dependencies {
           classpath("com.google.gms:google-services:4.4.2")
       }
   }
   ```

6. Edit `administrasi_mobile/android/app/build.gradle.kts`:
   ```kotlin
   plugins {
       id("com.android.application")
       id("kotlin-android")
       id("dev.flutter.flutter-gradle-plugin")
       id("com.google.gms.google-services")  // Tambahkan ini
   }
   ```

### 3. Setup untuk iOS (Flutter) - Opsional

1. Di Firebase Console, klik **Add app** → **iOS**
2. Masukkan bundle ID: `com.example.administrasiMobile`
3. Download file `GoogleService-Info.plist`
4. Buka Xcode dan drag file tersebut ke dalam project iOS Anda

### 4. Dapatkan Server Key (untuk Backend)

1. Di Firebase Console, klik **⚙️ Project Settings**
2. Pilih tab **Cloud Messaging**
3. Scroll ke bagian **Cloud Messaging API (Legacy)**
4. Copy **Server key**
5. Simpan ke file `.env` sebagai `FIREBASE_SERVER_KEY`

**⚠️ PENTING:** Jangan commit server key ini ke Git! Pastikan `.env` sudah ada di `.gitignore`

**📝 Catatan:** Anda tidak perlu download file JSON credentials karena kami menggunakan Legacy FCM API yang lebih sederhana.

---

## 🔨 Setup Backend (Laravel)

### 1. Install Dependencies

**TIDAK PERLU** install package tambahan! Laravel sudah mempunyai HTTP Client yang kita gunakan untuk FCM.

### 2. Jalankan Migration

```bash
cd administrasi
php artisan migrate
```

Migration ini akan membuat 3 tabel:
- `fcm_tokens` - Menyimpan token FCM dari device
- `announcements` - Menyimpan data pengumuman
- `announcement_recipients` - Track penerimaan dan status baca

### 3. Konfigurasi Environment

Edit file `.env` dan tambahkan:

```env
# Firebase Configuration
FIREBASE_SERVER_KEY=AAAA...your-server-key-from-firebase-console
```

**Cara mendapatkan Server Key:**
1. Buka Firebase Console → Project Settings
2. Tab "Cloud Messaging"
3. Scroll ke "Cloud Messaging API (Legacy)"
4. Copy "Server key"

### 4. Test Installation

```bash
php artisan tinker
```

```php
$fcm = app(\App\Services\FCMService::class);
echo "FCM Service Ready!";
exit
```

### 5. File-file yang Sudah Dibuat- `config/firebase.php` - Konfigurasi Firebase

✅ **Models:**
- `app/Models/FcmToken.php` - Model untuk FCM tokens
- `app/Models/Announcement.php` - Model untuk announcements
- `app/Models/AnnouncementRecipient.php` - Model untuk recipients

✅ **Services:**
- `app/Services/FCMService.php` - Service untuk mengirim notifikasi FCM

✅ **Controllers:**
- `app/Http/Controllers/AnnouncementController.php` - Controller untuk announcements

✅ **Routes:**
- `routes/announcements.php` - Routes untuk announcements dan FCM

✅ **Views (React/Inertia):**
- `resources/js/pages/announcements/index.tsx` - Halaman daftar pengumuman
- `resources/js/pages/announcements/form.tsx` - Form broadcast pengumuman
- `resources/js/pages/announcements/show.tsx` - Detail pengumuman

---

## 💻 Setup Frontend (React/Inertia)

### 1. Install Firebase SDK untuk Web (Opsional)

Jika ingin menambahkan web push notification:

```bash
npm install firebase
```

### 2. Akses Halaman Broadcast

Setelah setup selesai, Anda bisa akses:

- **Daftar Pengumuman:** `/announcements`
- **Broadcast Pengumuman:** `/announcements/create`
- **Detail Pengumuman:** `/announcements/{id}`

---

## 📱 Setup Mobile App (Flutter)

### 1. Install Dependencies

Jalankan di terminal:

```bash
cd administrasi_mobile
flutter pub get
```

### 2. Inisialisasi Firebase di main.dart

Edit file `lib/main.dart`:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize FCM Service
  final fcmService = FCMService();
  await fcmService.initialize();
  
  // Get FCM Token
  String? token = await fcmService.getToken();
  if (token != null) {
    print('FCM Token: $token');
    // TODO: Kirim token ke backend untuk disimpan
    // await apiService.registerFcmToken(token);
  }
  
  await initializeDateFormatting('id', null);
  runApp(const ProviderScope(child: AdministrasiMobileApp()));
}
```

### 3. Kirim Token ke Backend

Buat API call untuk register token. Contoh di `lib/services/api_service.dart`:

```dart
Future<void> registerFcmToken(String token) async {
  try {
    await dio.post(
      '/fcm/register-token',
      data: {
        'token': token,
        'device_type': Platform.isAndroid ? 'android' : 'ios',
        'device_name': await _getDeviceName(),
      },
    );
  } catch (e) {
    print('Error registering FCM token: $e');
  }
}
```

### 4. Handle Notification di Foreground

Service FCM sudah menghandle otomatis, tetapi Anda bisa customize di `fcm_service.dart`:

```dart
void _handleForegroundMessage(RemoteMessage message) {
  // Custom handling
  if (message.data['type'] == 'announcement') {
    // Navigate to announcement screen
    navigatorKey.currentState?.pushNamed(
      '/announcements/${message.data['announcement_id']}',
    );
  }
}
```

### 5. Permissions (Android)

Edit `administrasi_mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    
    <application>
        <!-- ... -->
        
        <!-- FCM default notification channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="high_importance_channel" />
    </application>
</manifest>
```

---

## 🧪 Testing

### 1. Test Broadcast Pengumuman

1. Login ke web aplikasi
2. Akses `/announcements/create`
3. Isi form:
   - **Judul:** "Testing FCM Notification"
   - **Tipe:** Pilih salah satu
   - **Pesan:** "Ini adalah test notifikasi FCM"
   - **Kirim Segera:** Aktifkan
4. Klik **Kirim Pengumuman**

### 2. Cek di Mobile App

- Jika app dalam keadaan **foreground**: Notifikasi akan muncul sebagai local notification
- Jika app dalam keadaan **background/closed**: Notifikasi muncul di system tray

### 3. Test dari Backend (Artisan Tinker)

```bash
php artisan tinker
```

```php
use App\Services\FCMService;
use App\Models\User;

$fcmService = app(FCMService::class);

// Test ke semua user
$result = $fcmService->sendToAllUsers(
    'Test Notification',
    'Ini adalah test notifikasi dari backend',
    ['type' => 'test']
);

print_r($result);
```

### 4. Monitoring

Cek logs:

```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Flutter logs
flutter logs
```

---

## 🔍 Troubleshooting

### Backend Issues

#### Error: "Firebase credentials file not found"

**TIDAK RELEVAN LAGI** - Kita menggunakan Legacy API dengan Server Key, tidak perlu file credentials JSON.

#### Error: "FCM Server Key not configured"

**Solusi:**
- Pastikan sudah menambahkan `FIREBASE_SERVER_KEY` di file `.env`
- Cek Server Key dari Firebase Console > Cloud Messaging
- Restart Laravel server setelah update `.env`

#### Error: "Invalid token" atau "not-found"

**Solusi:**
- Token FCM bisa expired atau invalid
- System sudah otomatis menghapus token invalid
- User perlu re-register token dari mobile app

### Flutter Issues

#### Error: "MissingPluginException"

**Solusi:**
```bash
flutter clean
flutter pub get
cd ios && pod install && cd ..  # untuk iOS
flutter run
```

#### Notifikasi tidak muncul di foreground

**Solusi:**
- Pastikan `FlutterLocalNotificationsPlugin` sudah diinisialisasi
- Cek notification channel sudah dibuat (Android)
- Cek permissions sudah granted

#### Token null atau tidak didapat

**Solusi:**
- Cek `google-services.json` sudah benar
- Pastikan Firebase Core sudah diinisialisasi
- Cek internet connection
- Cek Google Play Services (Android)

### General Issues

#### Notifikasi tidak sampai

**Checklist:**
1. ✅ Firebase project sudah setup
2. ✅ Server key sudah di `.env`
3. ✅ FCM token sudah tersimpan di database
4. ✅ Mobile app sudah dapat permission
5. ✅ Device terkoneksi internet

---

## 📝 Cara Menggunakan

### Broadcast Pengumuman dari Web

1. Login sebagai admin/user yang punya akses
2. Buka menu **Pengumuman** atau akses `/announcements`
3. Klik tombol **Broadcast Pengumuman**
4. Isi form:
   - **Judul Pengumuman:** Judul yang jelas dan ringkas
   - **Tipe Pengumuman:** 
     - **Umum** - Pengumuman biasa
     - **Penting** - Pengumuman urgent/penting
     - **Informasi** - Pengumuman informatif
   - **Pesan:** Tulis pesan lengkap
   - **Kirim Segera:** Toggle on/off
5. Klik **Kirim Pengumuman**

### Melihat Statistik Pengumuman

Di halaman detail pengumuman, Anda bisa melihat:
- Total penerima
- Jumlah yang sudah membaca
- Jumlah yang belum membaca
- Progress persentase
- Waktu pengiriman

---

## 🔒 Security Best Practices

1. **Jangan commit credentials:**
   ```
   # .gitignore
   storage/app/firebase/
   google-services.json
   GoogleService-Info.plist
   ```

2. **Validasi input di controller:**
   - Sudah diimplementasi di `AnnouncementController`

3. **Rate limiting:**
   Tambahkan di `routes/announcements.php`:
   ```php
   Route::middleware(['auth', 'throttle:10,1'])->group(function () {
       Route::post('/announcements', [AnnouncementController::class, 'store']);
   });
   ```

4. **Authorization:**
   Tambahkan policy jika perlu membatasi siapa yang bisa broadcast

---

## 🎯 Fitur yang Sudah Diimplementasi

✅ Backend (Laravel):
- FCM Service dengan Kreait Firebase PHP
- Model & Migration untuk FCM tokens dan announcements
- Controller untuk broadcast announcements
- Auto cleanup invalid tokens
- Track recipient status (read/unread)

✅ Frontend (Web):
- Form broadcast yang konsisten dengan desain existing
- Halaman daftar pengumuman dengan pagination
- Halaman detail dengan statistik lengkap
- UI/UX mengikuti pattern yang sudah ada

✅ Mobile (Flutter):
- FCM Service lengkap
- Handle foreground & background notifications
- Local notifications
- Auto register token ke backend

---

## 📞 Support

Jika ada kendala, cek:
1. Firebase Console untuk status quota
2. Laravel logs: `storage/logs/laravel.log`
3. Flutter logs: `flutter logs`
4. Network inspector untuk API calls

---

**Dibuat:** 10 Januari 2026  
**Versi:** 1.0.0
