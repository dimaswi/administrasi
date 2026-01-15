# 📊 Progress Fitur Aplikasi Administrasi

> **Ringkasan Pembagian**: Backend API (Laravel) - Shared Business Logic untuk Mobile App & Web App

---

## 🏗️ BACKEND API (Laravel)

### Shared Business Logic
- [x] Authentication & Authorization
- [x] Database Schema & Migrations
- [x] Models & Relationships
- [x] API Endpoints Structure
- [ ] API Rate Limiting
- [ ] API Versioning
- [ ] Comprehensive API Documentation

---

## 📱 MOBILE APP (Flutter)

**Target Pengguna**: ALL EMPLOYEES (Self-Service Portal)

### 🏗️ Infrastructure & Setup
- [ ] **Project Setup**
  - [ ] Flutter project initialization
  - [ ] Folder structure (Clean Architecture)
  - [ ] Environment configuration (dev, staging, prod)
  - [ ] App signing & keystore setup
  - [ ] CI/CD pipeline (GitHub Actions/Codemagic)
  - [ ] Firebase project setup

- [ ] **State Management**
  - [ ] Riverpod/Bloc setup
  - [ ] Global state management
  - [ ] Local state management
  - [ ] State persistence

- [ ] **Networking Layer**
  - [ ] Dio HTTP client setup
  - [ ] API base service
  - [ ] Request/Response interceptors
  - [ ] Error handling middleware
  - [ ] Retry mechanism
  - [ ] Network connectivity checker
  - [ ] API response models
  - [ ] Offline queue for requests

- [ ] **Local Storage**
  - [ ] Hive/SharedPreferences setup
  - [ ] Secure storage (flutter_secure_storage)
  - [ ] Token management
  - [ ] User session caching
  - [ ] Offline data caching

- [ ] **Authentication Infrastructure**
  - [ ] JWT token handling
  - [ ] Refresh token mechanism
  - [ ] Auto-logout on token expiry
  - [ ] Biometric authentication (fingerprint/face)
  - [ ] PIN/Pattern lock
  - [ ] Session management

- [ ] **Navigation & Routing**
  - [ ] GoRouter/AutoRoute setup
  - [ ] Deep linking configuration
  - [ ] Route guards (auth required)
  - [ ] Bottom navigation
  - [ ] Nested navigation

- [ ] **Dependency Injection**
  - [ ] GetIt/Injectable setup
  - [ ] Service locator pattern
  - [ ] Repository registration
  - [ ] Use case registration

- [ ] **Localization**
  - [ ] Multi-language support (ID/EN)
  - [ ] easy_localization setup
  - [ ] Date/time formatting
  - [ ] Number formatting

- [ ] **Theme & Design System**
  - [ ] Custom theme (light/dark)
  - [ ] Color palette
  - [ ] Typography system
  - [ ] Spacing system
  - [ ] Custom widgets library
  - [ ] Responsive layout helpers

- [ ] **Location Services**
  - [ ] Geolocator setup
  - [ ] Permission handling
  - [ ] Background location (for clock-in)
  - [ ] Geofencing setup
  - [ ] Mock location detection

- [ ] **Push Notifications**
  - [ ] Firebase Cloud Messaging setup
  - [ ] Local notifications
  - [ ] Notification channels
  - [ ] Notification handling (foreground/background)
  - [ ] Deep link from notification

- [ ] **Image & File Handling**
  - [ ] Image picker setup
  - [ ] Camera integration
  - [ ] File download manager
  - [ ] Image compression
  - [ ] File caching

- [ ] **Error Tracking & Analytics**
  - [ ] Firebase Crashlytics
  - [ ] Firebase Analytics
  - [ ] Custom event tracking
  - [ ] Performance monitoring

- [ ] **Security**
  - [ ] SSL pinning
  - [ ] Root/Jailbreak detection
  - [ ] App integrity check
  - [ ] Obfuscation setup
  - [ ] Secure API keys storage

### 🔐 Authentication Module
- [ ] **Login**
  - [ ] Login screen UI
  - [ ] Email/Employee ID login
  - [ ] Password visibility toggle
  - [ ] Remember me
  - [ ] Forgot password flow
  - [ ] Login validation
  - [ ] Loading states
  - [ ] Error handling

- [ ] **Biometric Auth**
  - [ ] Enable biometric option
  - [ ] Fingerprint login
  - [ ] Face ID login
  - [ ] Fallback to PIN

- [ ] **Session Management**
  - [ ] Auto logout
  - [ ] Session timeout warning
  - [ ] Force logout (from server)
  - [ ] Multiple device handling

### 🏠 Dashboard Module
- [ ] **Home Dashboard**
  - [ ] Welcome greeting
  - [ ] Today's schedule card
  - [ ] Clock-in/out status
  - [ ] Quick actions menu
  - [ ] Attendance summary (this month)
  - [ ] Leave balance card
  - [ ] Upcoming events/training
  - [ ] Recent notifications
  - [ ] Pull-to-refresh

### ⏰ Attendance Module
- [ ] **Clock In/Out**
  - [ ] Clock-in button with GPS
  - [ ] Clock-out button with GPS
  - [ ] Current location display
  - [ ] Office location validation
  - [ ] Distance from office indicator
  - [ ] Photo capture on clock-in
  - [ ] Offline clock-in queue
  - [ ] Clock-in confirmation
  - [ ] Late warning notification

- [ ] **Attendance History**
  - [ ] Monthly calendar view
  - [ ] Daily attendance list
  - [ ] Status indicators (present/late/absent)
  - [ ] Filter by month/status
  - [ ] Attendance detail view
  - [ ] Total work hours

- [ ] **Work Schedule**
  - [ ] Weekly schedule view
  - [ ] Monthly schedule view
  - [ ] Shift details
  - [ ] Schedule change notifications

### 📝 Leave Module
- [ ] **Leave Request**
  - [ ] Leave request form
  - [ ] Leave type selection
  - [ ] Date range picker
  - [ ] Reason input
  - [ ] Attachment upload
  - [ ] Balance checker
  - [ ] Submit confirmation
  - [ ] Draft save

- [ ] **Leave History**
  - [ ] Request list
  - [ ] Status filter (pending/approved/rejected)
  - [ ] Request detail view
  - [ ] Cancel request
  - [ ] Edit draft request

- [ ] **Leave Balance**
  - [ ] Balance by leave type
  - [ ] Annual leave remaining
  - [ ] Sick leave used
  - [ ] Balance history

### ⏱️ Overtime Module
- [ ] **Overtime Request**
  - [ ] Overtime request form
  - [ ] Date selection
  - [ ] Duration input
  - [ ] Reason/task description
  - [ ] Submit confirmation

- [ ] **Overtime History**
  - [ ] Request list
  - [ ] Status tracking
  - [ ] Approval status
  - [ ] Compensation info

### 📚 Training Module
- [ ] **My Training**
  - [ ] Enrolled training list
  - [ ] Available training list
  - [ ] Training detail view
  - [ ] Enroll to training
  - [ ] Training progress

- [ ] **Certificates**
  - [ ] My certificates list
  - [ ] Certificate detail
  - [ ] Download certificate
  - [ ] Expiring soon alerts

### 📜 Credentials Module
- [ ] **My Credentials**
  - [ ] Credentials list
  - [ ] Credential detail
  - [ ] Download document
  - [ ] Expiry reminders

### 📋 Approvals Module (Supervisor)
- [ ] **Pending Approvals**
  - [ ] Leave requests pending
  - [ ] Overtime requests pending
  - [ ] Batch approval
  - [ ] Approve/Reject with comment
  - [ ] Delegation setup

- [ ] **Approval History**
  - [ ] Approved list
  - [ ] Rejected list
  - [ ] Filter & search

### 📨 Disposition Module
- [ ] **Inbox Disposisi**
  - [ ] Incoming dispositions list
  - [ ] Disposition detail
  - [ ] Mark as read
  - [ ] Follow-up action
  - [ ] Status update

- [ ] **Disposition History**
  - [ ] Completed dispositions
  - [ ] Filter by status

### 🔔 Notifications Module
- [ ] **Notification Center**
  - [ ] All notifications list
  - [ ] Mark as read
  - [ ] Mark all as read
  - [ ] Delete notification
  - [ ] Notification settings

### 👤 Profile Module
- [ ] **My Profile**
  - [ ] View personal info
  - [ ] View employment info
  - [ ] Edit contact info
  - [ ] Change photo
  - [ ] Change password
  - [ ] Notification preferences
  - [ ] Language setting
  - [ ] Theme setting
  - [ ] Logout

### 📊 Performance Module
- [ ] **My Performance**
  - [ ] Current review status
  - [ ] Self assessment form
  - [ ] Goals tracking
  - [ ] Performance history
  - [ ] Feedback received

---

## 🔌 Backend API (Laravel) - Mobile Endpoints

### Authentication Endpoints
- [ ] `POST /api/v1/auth/login` - Login
- [ ] `POST /api/v1/auth/logout` - Logout
- [ ] `POST /api/v1/auth/refresh` - Refresh token
- [ ] `POST /api/v1/auth/forgot-password` - Forgot password
- [ ] `GET /api/v1/auth/me` - Get current user

### Dashboard Endpoints
- [ ] `GET /api/v1/dashboard` - Dashboard summary
- [ ] `GET /api/v1/dashboard/schedule-today` - Today's schedule
- [ ] `GET /api/v1/dashboard/notifications` - Recent notifications

### Attendance Endpoints
- [ ] `POST /api/v1/attendance/clock-in` - Clock in with GPS
- [ ] `POST /api/v1/attendance/clock-out` - Clock out with GPS
- [ ] `GET /api/v1/attendance/today` - Today's attendance
- [ ] `GET /api/v1/attendance/history` - Attendance history
- [ ] `GET /api/v1/attendance/monthly/{month}` - Monthly summary

### Schedule Endpoints
- [ ] `GET /api/v1/schedule/weekly` - Weekly schedule
- [ ] `GET /api/v1/schedule/monthly/{month}` - Monthly schedule

### Leave Endpoints
- [ ] `GET /api/v1/leave/types` - Leave types
- [ ] `GET /api/v1/leave/balance` - Leave balance
- [ ] `GET /api/v1/leave/requests` - My leave requests
- [ ] `POST /api/v1/leave/requests` - Submit leave request
- [ ] `PUT /api/v1/leave/requests/{id}` - Update leave request
- [ ] `DELETE /api/v1/leave/requests/{id}` - Cancel leave request

### Overtime Endpoints
- [ ] `GET /api/v1/overtime/requests` - My overtime requests
- [ ] `POST /api/v1/overtime/requests` - Submit overtime request
- [ ] `PUT /api/v1/overtime/requests/{id}` - Update overtime
- [ ] `DELETE /api/v1/overtime/requests/{id}` - Cancel overtime

### Approval Endpoints (Supervisor)
- [ ] `GET /api/v1/approvals/pending` - Pending approvals
- [ ] `POST /api/v1/approvals/{type}/{id}/approve` - Approve
- [ ] `POST /api/v1/approvals/{type}/{id}/reject` - Reject
- [ ] `GET /api/v1/approvals/history` - Approval history

### Training Endpoints
- [ ] `GET /api/v1/training/enrolled` - My enrolled training
- [ ] `GET /api/v1/training/available` - Available training
- [ ] `POST /api/v1/training/{id}/enroll` - Enroll to training
- [ ] `GET /api/v1/training/certificates` - My certificates

### Credential Endpoints
- [ ] `GET /api/v1/credentials` - My credentials
- [ ] `GET /api/v1/credentials/{id}` - Credential detail
- [ ] `GET /api/v1/credentials/{id}/download` - Download document

### Disposition Endpoints
- [ ] `GET /api/v1/dispositions/inbox` - Inbox dispositions
- [ ] `GET /api/v1/dispositions/{id}` - Disposition detail
- [ ] `PUT /api/v1/dispositions/{id}/follow-up` - Follow up
- [ ] `PUT /api/v1/dispositions/{id}/mark-read` - Mark as read

### Notification Endpoints
- [ ] `GET /api/v1/notifications` - All notifications
- [ ] `PUT /api/v1/notifications/{id}/read` - Mark as read
- [ ] `PUT /api/v1/notifications/read-all` - Mark all as read
- [ ] `DELETE /api/v1/notifications/{id}` - Delete notification
- [ ] `PUT /api/v1/notifications/settings` - Update settings

### Profile Endpoints
- [ ] `GET /api/v1/profile` - Get profile
- [ ] `PUT /api/v1/profile` - Update profile
- [ ] `POST /api/v1/profile/photo` - Update photo
- [ ] `PUT /api/v1/profile/password` - Change password

### Performance Endpoints
- [ ] `GET /api/v1/performance/current` - Current review
- [ ] `GET /api/v1/performance/history` - Performance history
- [ ] `PUT /api/v1/performance/self-review` - Submit self review
- [ ] `GET /api/v1/performance/goals` - My goals
- [ ] `GET /api/v1/performance/feedback` - Feedback received

---

## 🌐 WEB APP (Inertia + React)

**Target Pengguna**: HR & ADMIN

### ✅ Dashboard & Analytics
- [x] **Dashboard Analytics**
  - [x] Statistik karyawan
  - [x] Card summary (total karyawan, aktif, resign, dll)
  - [x] Recent activities
  - [x] Chart kehadiran (7 hari terakhir)
  - [x] Chart turnover (12 bulan)
  - [x] Ringkasan kehadiran bulanan
  - [x] Statistik cuti bulanan
  - [ ] Chart performance

### ✅ Employee Management
- [x] **Employee CRUD**
  - [x] List karyawan dengan filter & search
  - [x] Tambah karyawan baru
  - [x] Edit data karyawan
  - [x] Detail karyawan (tabs)
  - [x] Upload foto karyawan
  - [x] Data personal
  - [x] Data kepegawaian
  - [x] Data keluarga
  - [x] Data pendidikan
  - [x] Riwayat pekerjaan
  - [x] Status karyawan (active/inactive/resigned/terminated)
  - [ ] Import karyawan (Excel/CSV)
  - [ ] Export karyawan (Excel/CSV/PDF)
  - [ ] Bulk update status

### ✅ Schedule Management
- [x] **Template Jadwal (Work Schedules)**
  - [x] List template shift
  - [x] Tambah template shift
  - [x] Edit template shift
  - [x] Detail template shift
  - [x] Hapus template shift
  - [x] Set jam masuk/keluar
  - [x] Set toleransi keterlambatan
  - [x] Set flexible schedule
  
- [x] **Jadwal Karyawan (Employee Schedules)**
  - [x] List karyawan dengan jadwal
  - [x] Assign jadwal ke karyawan
  - [x] Edit jadwal karyawan
  - [x] Detail jadwal karyawan
  - [x] Jadwal per hari (Sen-Min)
  - [x] Periode berlaku jadwal
  - [x] Riwayat perubahan jadwal
  - [x] Atur jadwal massal (bulk assignment)
  - [ ] Copy jadwal ke periode berikutnya
  - [ ] Export jadwal (Excel/PDF)
  - [ ] Template jadwal standar (preset)

### ✅ Attendance Management
- [x] **Attendance Mgmt**
  - [x] Dashboard kehadiran
  - [x] List kehadiran harian
  - [x] Input manual absensi
  - [x] Edit manual absensi
  - [x] Input kehadiran massal (bulk)
  - [x] Laporan kehadiran bulanan
  - [x] Export kehadiran harian (CSV)
  - [x] Export rekap kehadiran bulanan (CSV)
  - [x] Import data kehadiran (CSV)
  - [ ] Validasi GPS check-in (mobile)
  - [ ] Approve manual attendance

### ✅ Leave Management
- [x] **Leave Management**
  - [x] List pengajuan cuti/izin
  - [x] Form pengajuan cuti
  - [x] Approve/Reject cuti
  - [x] Batalkan pengajuan
  - [x] Konfigurasi jenis cuti (master data)
  - [x] Kuota cuti per karyawan
  - [x] Saldo cuti tahunan
  - [x] Detail pengajuan cuti
  - [x] Export data cuti (CSV)
  - [ ] Riwayat cuti
  - [ ] Laporan cuti bulanan
  - [ ] Notifikasi approval

### ✅ Credential Management
- [x] **Credential Mgmt**
  - [x] List kredensial karyawan
  - [x] Tambah kredensial
  - [x] Edit kredensial
  - [x] Detail kredensial
  - [x] Upload dokumen kredensial
  - [x] Tracking masa berlaku
  - [x] Filter kredensial kedaluwarsa
  - [x] Verifikasi kredensial
  - [x] Statistik kredensial
  - [x] Export credential data (CSV)
  - [ ] Notifikasi kadaluarsa
  - [ ] Laporan kredensial

### ✅ Training Management
- [x] **Training Mgmt**
  - [x] List program training dengan filter
  - [x] Tambah program training
  - [x] Edit program training
  - [x] Detail program training
  - [x] Hapus program training
  - [x] Status aktif/nonaktif
  - [x] Training wajib/opsional
  - [x] Kategori training (technical, soft_skill, leadership, dll)
  - [x] Tipe training (internal, external, online, certification, dll)
  
- [x] **Peserta Training (Employee Training)**
  - [x] List peserta training
  - [x] Tambah peserta ke training
  - [x] Edit data peserta training
  - [x] Detail peserta training
  - [x] Status peserta (registered, in_progress, completed, failed, cancelled)
  - [x] Nilai dan grade
  - [x] Upload sertifikat
  - [x] Tracking masa berlaku sertifikat
  - [x] Feedback dan rating
  - [x] Export data training (CSV)
  - [x] Export peserta training (CSV)
  - [ ] Notifikasi sertifikat kadaluarsa
  - [ ] Laporan training per karyawan
  - [ ] Laporan training

### ✅ Performance Management
- [x] **Performance Mgmt**
  - [x] Periode Penilaian (CRUD, set current, activate, close)
  - [x] Kategori KPI (CRUD, ordering, weight)
  - [x] Template KPI (CRUD, measurement types: numeric/percentage/rating/yes_no)
  - [x] Performance Review CRUD
  - [x] Self Review workflow
  - [x] Manager Review workflow
  - [x] Final scoring & grading (A-E)
  - [x] Employee Goals tracking
  - [x] Export performance data (CSV)
  - [x] Navigasi menu Kinerja di HR module
  - [x] 360 Feedback (full implementation)
    - [x] Feedback Session CRUD
    - [x] Add/Remove Participants
    - [x] Add/Remove Reviewers (Self, Peer, Manager, Subordinate)
    - [x] Question Categories & Management
    - [x] Anonymous Feedback Support
    - [x] Min Reviewers Validation
    - [x] Employee Portal - My Feedback Requests
    - [x] Employee Portal - Give Feedback Form
    - [x] Employee Portal - View My Results
    - [x] Score Calculation by Category & Relationship
    - [x] Detailed Result Report per Participant
  - [x] Performance Calibration (full implementation)
    - [x] Calibration Session CRUD
    - [x] Import Reviews from Period
    - [x] Grade Distribution View
    - [x] Individual Review Calibration
    - [x] Score & Grade Adjustment
    - [x] Discussion Comments
    - [x] Change Tracking (Before/After)
    - [x] Session Start/Complete Workflow

### ✅ Reports & Analytics
- [x] **Reports & Analytics**
  - [x] Reports Hub (pusat laporan)
  - [x] Laporan kehadiran (rekap bulanan)
  - [x] Laporan cuti (per tahun/bulan/unit/jenis)
  - [x] Laporan training (per tahun/bulan/kategori)
  - [x] Laporan kinerja (per periode)
  - [x] Laporan karyawan (ringkasan aktivitas)
  - [x] Export semua laporan (CSV)
  - [x] Laporan turnover (full implementation)
    - [x] New Hires Tracking
    - [x] Separations Tracking (Resign & Termination)
    - [x] Turnover Rate Calculation
    - [x] Voluntary vs Involuntary Turnover
    - [x] Monthly Trend Chart
    - [x] Separations by Reason
    - [x] Comparison per Unit
    - [x] Export to CSV
  - [ ] Custom report builder
  - [ ] Scheduled reports

### ✅ Import Data
- [x] **Import Data**
  - [x] Import Hub
  - [x] Import karyawan dari CSV
  - [x] Import kehadiran dari CSV
  - [x] Download template import
  - [x] Validasi data import
  - [x] Error reporting

### ✅ System Configuration
- [x] **Settings & Config**
  - [x] Profile settings (update profile)
  - [x] Password settings (change password)
  - [x] Appearance settings (theme)
  - [ ] Pengaturan perusahaan
  - [ ] Pengaturan shift
  - [ ] Pengaturan cuti
  - [ ] Pengaturan approval workflow
  - [ ] Pengaturan notifikasi
  - [ ] Pengaturan lokasi kantor (GPS)
  - [ ] Email templates
  - [ ] System logs
  
- [x] **Role & Permission Management**
  - [x] CRUD Role
  - [x] CRUD Permission  
  - [x] Assign permissions to role
  
- [x] **User Management**
  - [x] CRUD User
  - [x] Assign role to user
  
- [x] **Room Management (Ruangan)**
  - [x] CRUD Room
  - [x] Kapasitas ruangan
  - [x] Status ruangan

### ✅ Document Management (Modul Administrasi)
- [x] **Document Management**
  - [x] Arsip surat masuk (CRUD, download, preview)
  - [x] Arsip surat keluar (CRUD, preview, download PDF)
  - [x] Disposisi surat (CRUD, follow-up, mark status)
  - [x] Template surat (CRUD, preview, duplicate, toggle active)
  - [x] Tracking surat (status tracking)
  - [x] Digital signature (tanda tangan digital dengan verifikasi)
  - [x] Document approval (workflow approval surat)
  - [x] Document storage (arsip dokumen)
  - [x] Verifikasi tanda tangan digital
  - [x] Archive expiring management
  
- [x] **Meeting Management (Rapat)**
  - [x] CRUD Meeting/Rapat
  - [x] Attendance tracking (daftar hadir)
  - [x] Meeting memo (notulensi)
  - [x] Public check-in
  - [x] Verify signature
  - [x] Calendar view

### ✅ Master Data
- [x] **Job Categories (Kategori Pekerjaan)**
  - [x] CRUD job categories
  - [x] Medical flag
  - [x] STR/SIP requirements
  
- [x] **Employment Status**
  - [x] CRUD employment status
  - [x] Active/inactive status
  
- [x] **Education Levels**
  - [x] CRUD education levels
  - [x] Level ordering
  
- [x] **Organization Units**
  - [x] CRUD organization units
  - [x] Hierarchical structure
  - [x] Unit code & name

---

## 📈 Progress Summary

### Web App - Modul HR
- ✅ **Selesai (100%)**: Employee Management, Schedule Management, Master Data HR, Attendance, Leave, Credential, Training
- ✅ **Selesai (100%)**: Reports & Analytics (Laporan Cuti, Training, Kinerja, Karyawan, Turnover)
- ✅ **Selesai (100%)**: Import Data (Import Karyawan, Kehadiran dari CSV)
- ✅ **Selesai (100%)**: Performance Management (including 360 Feedback & Calibration)
- ✅ **Selesai (80%)**: Dashboard HR Analytics

### Web App - Modul Administrasi
- ✅ **Selesai (100%)**: Document Management (Surat Masuk, Surat Keluar, Disposisi, Template, Archive)
- ✅ **Selesai (100%)**: Meeting Management
- ✅ **Selesai (100%)**: Master Data (Role, Permission, User, Room, Organization)
- ✅ **Selesai (50%)**: Settings (Profile, Password, Appearance)

### Mobile App (Flutter) - Employee Portal
| Category | Progress | Details |
|----------|----------|---------|
| Infrastructure | 0% | Project setup, architecture, networking |
| Authentication | 0% | Login, biometric, session |
| Dashboard | 0% | Home, quick actions, summary |
| Attendance | 0% | Clock in/out, GPS, history |
| Leave | 0% | Request, history, balance |
| Overtime | 0% | Request, history |
| Training | 0% | Enrolled, certificates |
| Credentials | 0% | List, download |
| Approvals | 0% | Supervisor features |
| Disposition | 0% | Inbox, follow-up |
| Notifications | 0% | Push, in-app |
| Profile | 0% | View, edit, settings |
| Performance | 0% | Review, goals |
| **Backend API** | 0% | Mobile-specific endpoints |

### Overall Progress
- **Web App HR**: ~98% Complete
- **Web App Administrasi**: ~95% Complete
- **Mobile App (Flutter)**: 0% Complete
- **Backend API (Mobile)**: 0% Complete

---

## 🎯 Prioritas Selanjutnya

### Phase 1: Mobile Infrastructure (Week 1-2)
1. Flutter project setup dengan Clean Architecture
2. Networking layer (Dio, interceptors, error handling)
3. Authentication infrastructure (JWT, refresh token)
4. Local storage & state management
5. Navigation & routing setup

### Phase 2: Core Mobile Features (Week 3-4)
1. Login & biometric authentication
2. Dashboard home screen
3. Clock in/out dengan GPS
4. Attendance history

### Phase 3: Employee Self-Service (Week 5-6)
1. Leave request & history
2. Overtime request
3. Work schedule view
4. Profile management

### Phase 4: Backend API Mobile (Parallel)
1. Authentication endpoints
2. Attendance endpoints (with GPS validation)
3. Leave & overtime endpoints
4. Dashboard endpoints

### Phase 5: Advanced Features (Week 7-8)
1. Push notifications (FCM)
2. Approval features (supervisor)
3. Disposition inbox
4. Training & credentials

---

## 📝 Catatan Teknis

### Stack Technology
- **Backend**: Laravel 11, PHP 8.2+
- **Frontend Web**: React 18, Inertia.js, TypeScript
- **UI Library Web**: Tailwind CSS, shadcn/ui
- **Database**: MySQL
- **Mobile**: Flutter 3.x, Dart
- **Mobile State**: Riverpod / Bloc
- **Mobile HTTP**: Dio
- **Mobile Storage**: Hive, flutter_secure_storage
- **Mobile Push**: Firebase Cloud Messaging

### Architecture Pattern
- **Web**: MVC (Laravel) + Component-based (React)
- **Mobile**: Clean Architecture + Repository Pattern
  ```
  lib/
  ├── core/
  │   ├── constants/
  │   ├── errors/
  │   ├── network/
  │   ├── storage/
  │   └── utils/
  ├── features/
  │   ├── auth/
  │   │   ├── data/
  │   │   │   ├── datasources/
  │   │   │   ├── models/
  │   │   │   └── repositories/
  │   │   ├── domain/
  │   │   │   ├── entities/
  │   │   │   ├── repositories/
  │   │   │   └── usecases/
  │   │   └── presentation/
  │   │       ├── bloc/
  │   │       ├── pages/
  │   │       └── widgets/
  │   ├── attendance/
  │   ├── leave/
  │   └── ...
  └── main.dart
  ```

### Pattern yang Digunakan
- ✅ Consistent layout dengan `IndexPage`, `FormPage`, `DetailPage` components
- ✅ Responsive design untuk mobile & desktop
- ✅ Dark mode support
- ✅ Type-safe dengan TypeScript
- ✅ Component reusability
- ✅ ScrollArea untuk viewport management
- ✅ Breadcrumb navigation
- ✅ Filter & search functionality
- ✅ Pagination
- ✅ Toast notifications
- ✅ Sidebar layout dengan workspace switcher (Filament-style)
- ✅ Permission-based navigation filtering
- ✅ Export CSV functionality
- ✅ Import CSV functionality dengan validasi

---

**Last Updated**: 10 Januari 2026
**Version**: 1.4.0
