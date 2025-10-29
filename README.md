# 📄 Sistem Administrasi Surat & Arsip

<div align="center">

![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Sistem manajemen surat masuk, surat keluar, disposisi, dan pengarsipan dokumen berbasis web dengan fitur digital signature dan multi-level approval.

[Fitur](#-fitur-utama) • [Instalasi](#-instalasi) • [Docker](#-deployment-dengan-docker) • [Dokumentasi](#-dokumentasi) • [Kontribusi](#-kontribusi)

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Instalasi](#-instalasi)
- [Deployment dengan Docker](#-deployment-dengan-docker)
- [Konfigurasi](#%EF%B8%8F-konfigurasi)
- [Penggunaan](#-penggunaan)
- [Testing](#-testing)
- [Dokumentasi API](#-dokumentasi-api)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## 🎯 Tentang Proyek

Sistem Administrasi Surat & Arsip adalah aplikasi web modern yang dirancang untuk mengelola surat masuk, surat keluar, disposisi, dan pengarsipan dokumen secara digital. Aplikasi ini dilengkapi dengan fitur digital signature, multi-level approval, dan sistem notifikasi real-time.

### Masalah yang Diselesaikan

- ✅ Pengelolaan surat masuk dan keluar yang terstruktur
- ✅ Sistem disposisi multi-level dengan tracking progress
- ✅ Digital signature dengan QR code verification
- ✅ Pengarsipan dokumen yang mudah dicari
- ✅ Approval workflow yang fleksibel
- ✅ Audit trail lengkap untuk setiap dokumen

---

## ✨ Fitur Utama

### 📨 Manajemen Surat Masuk
- Upload dan registrasi surat masuk dengan metadata lengkap
- Klasifikasi surat (Biasa, Penting, Segera, Rahasia)
- Attachment management
- Full-text search
- Status tracking (Baru → Disposisi → Selesai → Arsip)

### 📤 Manajemen Surat Keluar
- Template surat dengan dynamic variables
- Letter numbering otomatis (configurable)
- Preview surat dengan letterhead
- Multi-level approval workflow
- Digital signature dengan QR code
- PDF generation dengan certificate
- Revoke approval mechanism

### 📋 Sistem Disposisi
- Multi-level disposition (parent-child hierarchy)
- Priority levels (Normal, High, Urgent)
- Deadline tracking dengan overdue notification
- Follow-up notes
- Status updates (Pending → In Progress → Completed)
- Disposition tree visualization

### 🗄️ Sistem Arsip
- **Auto-archive** untuk surat yang sudah completed/fully signed
- Unified archive system (incoming letters, outgoing letters, documents)
- Retention period management
- Classification levels (Public, Internal, Confidential, Secret)
- Advanced search & filtering
- Document metadata storage
- Expiring archives notification

### 📝 Template Management
- WYSIWYG editor untuk template surat
- Dynamic variables dengan validation
- Multi-signature configuration
- Template sharing antar unit organisasi
- Letterhead customization
- Template versioning

### 👥 User & Role Management
- Role-based access control (RBAC)
- Organization unit hierarchy
- Permission management
- User profiles dengan foto
- Activity logging

### 🔔 Notifikasi
- Real-time notifications
- Email notifications (optional)
- Notification types:
  - Approval requests
  - Disposition assignments
  - Deadline reminders
  - Status updates

### 📊 Dashboard & Reporting
- Letter statistics
- Disposition progress tracking
- Pending approvals overview
- Archive statistics
- Activity timeline

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 12.x
- **Language**: PHP 8.3+
- **Database**: PostgreSQL 16.x
- **PDF Generation**: DomPDF
- **QR Code**: SimpleSoftwareIO/simple-qrcode

### Frontend
- **Framework**: React 18.x + TypeScript
- **SSR**: Inertia.js
- **UI Components**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Date**: date-fns
- **Notifications**: Sonner

### DevOps
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx
- **Process Manager**: Supervisor
- **CI/CD**: GitHub Actions (optional)

---

## 💻 Persyaratan Sistem

### Development
- PHP >= 8.3
- Composer >= 2.6
- Node.js >= 20.x
- NPM/Yarn/Bun
- PostgreSQL >= 16.x
- Redis (optional, untuk cache & queue)

### Production (Docker)
- Docker >= 24.x
- Docker Compose >= 2.x
- 2GB RAM minimum (4GB recommended)
- 10GB disk space

---

## 📦 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/dimaswi/administrasi.git
cd administrasi
```

### 2. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install
# atau
yarn install
```

### 3. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 4. Database Configuration

Edit `.env` file:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=administrasi
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### 5. Database Migration & Seeding

```bash
# Run migrations
php artisan migrate

# Run seeders (optional, untuk data dummy)
php artisan db:seed
```

### 6. Storage Link

```bash
php artisan storage:link
```

### 7. Build Frontend Assets

```bash
# Development
npm run dev

# Production
npm run build
```

### 8. Run Application

```bash
# Development server
php artisan serve

# Di terminal terpisah, jalankan Vite
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8000`

---

## 🐳 Deployment dengan Docker

### Quick Start

```bash
# Clone repository
git clone https://github.com/dimaswi/administrasi.git
cd administrasi

# Copy environment file
cp .env.example .env

# Build dan start containers
docker-compose up -d --build

# Install dependencies & setup database
docker-compose exec app composer install
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan migrate --seed
docker-compose exec app php artisan storage:link

# Build frontend
docker-compose exec app npm install
docker-compose exec app npm run build
```

Aplikasi akan berjalan di `http://localhost` (port 80)

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| **app** | 9000 | PHP-FPM application |
| **nginx** | 80, 443 | Web server |
| **postgres** | 5432 | PostgreSQL database |
| **redis** | 6379 | Redis cache & queue |

### Environment Variables untuk Docker

Edit `.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=http://your-domain.com

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=administrasi
DB_USERNAME=postgres
DB_PASSWORD=secret

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f app

# Access application container
docker-compose exec app bash

# Access database
docker-compose exec postgres psql -U postgres -d administrasi

# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild containers
docker-compose up -d --build

# Run artisan commands
docker-compose exec app php artisan [command]

# Run npm commands
docker-compose exec app npm [command]
```

### Production Optimization

```bash
# Inside app container
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Optimize composer autoloader
composer install --optimize-autoloader --no-dev
```

---

## ⚙️ Konfigurasi

### Letter Numbering

Konfigurasi format nomor surat di `config/letter_numbering.php` atau melalui UI Admin.

Contoh format:
```
{number}/{code}/{roman_month}/{year}
001/SK/X/2025
```

### Email Configuration

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"
```

### File Storage

```env
FILESYSTEM_DISK=public

# Untuk production, gunakan S3 atau cloud storage
# FILESYSTEM_DISK=s3
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_DEFAULT_REGION=
# AWS_BUCKET=
```

### Queue Configuration

```env
QUEUE_CONNECTION=redis

# Jalankan queue worker
php artisan queue:work --tries=3
```

---

## 🚀 Penggunaan

### Default Users (setelah seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@example.com | password |
| Manager | manager@example.com | password |
| Staff | staff@example.com | password |

### Workflow Surat Keluar

1. **Buat Surat**: Pilih template → Isi data → Simpan sebagai draft
2. **Submit Approval**: Ajukan untuk persetujuan
3. **Approval Process**: Approver menyetujui/menolak
4. **Generate PDF**: Setelah fully signed, PDF dibuat dengan digital signature
5. **Archive**: Arsipkan surat untuk penyimpanan jangka panjang

### Workflow Surat Masuk

1. **Register**: Upload file & isi metadata surat masuk
2. **Create Disposition**: Buat disposisi ke user terkait
3. **Process**: User memproses disposisi (add follow-ups)
4. **Complete**: Tandai sebagai selesai
5. **Archive**: Arsipkan surat masuk

---

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/LetterTest.php

# Run with coverage
php artisan test --coverage

# Run Pest tests
./vendor/bin/pest
```

---

## 📚 Dokumentasi API

API endpoints tersedia untuk integrasi dengan sistem lain.

### Authentication

```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

### Get Letters

```http
GET /api/letters
Authorization: Bearer {token}
```

Dokumentasi lengkap API tersedia di `/api/documentation` (Swagger/OpenAPI)

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan ikuti langkah berikut:

1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### Coding Standards

- Follow PSR-12 untuk PHP
- ESLint + Prettier untuk TypeScript/React
- Write tests untuk fitur baru
- Update documentation

---

## 📝 Changelog

### [1.0.0] - 2025-10-29

#### Added
- ✨ Initial release
- ✨ Surat masuk & keluar management
- ✨ Multi-level disposition system
- ✨ Digital signature dengan QR code
- ✨ Archive system dengan auto-archive
- ✨ Template management dengan WYSIWYG
- ✨ Docker deployment ready
- ✨ Multi-level approval workflow

#### Features
- 📨 Incoming letters with file upload
- 📤 Outgoing letters with template system
- 📋 Disposition hierarchy with follow-ups
- 🗄️ Unified archive system (incoming, outgoing, documents)
- 👥 RBAC dengan organization units
- 🔔 Real-time notifications
- 📊 Dashboard & statistics

---

## 🔒 Security

Jika menemukan security vulnerability, silakan kirim email ke: security@yourdomain.com

**Jangan** buat public issue untuk security issues.

---

## 📄 Lisensi

Distributed under the MIT License. See `LICENSE` file for more information.

---

## 👤 Author

**Dimas Wicaksono**

- GitHub: [@dimaswi](https://github.com/dimaswi)
- Email: dimas@example.com

---

## 🙏 Acknowledgments

- [Laravel](https://laravel.com)
- [React](https://reactjs.org)
- [Inertia.js](https://inertiajs.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

<div align="center">

**[⬆ Kembali ke atas](#-sistem-administrasi-surat--arsip)**

Made with ❤️ by Dimas Wicaksono

</div>
