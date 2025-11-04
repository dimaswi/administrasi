# Sistem PDF dengan Multiple Digital Signatures

## Overview
Sistem ini mengimplementasikan PDF generation dengan multiple digital signatures menggunakan QR codes untuk setiap penanda tangan (approver). Setiap signature memiliki certificate yang unik dan dapat diverifikasi secara independen.

## Features

### 1. Multiple Signatures Support
- Setiap surat dapat memiliki multiple approvers (penanda tangan)
- Setiap approver mendapat certificate ID unik
- QR code untuk setiap signature terpisah
- Sequential approval process

### 2. Digital Certificate System
- **Certificate Generation**: Otomatis saat approval
- **Unique Certificate ID**: Format `CERT-YYYY-XXXXX`
- **Signature Hash**: SHA-256 hash untuk setiap approval
- **Document Hash**: SHA-256 hash untuk verifikasi integritas dokumen
- **Metadata**: IP address, user agent, timestamp, dll

### 3. QR Code Verification
- **Per-Signature QR Code**: Setiap signature punya QR code sendiri (56x56px di PDF)
- **Verification URL**: `/verify-signature/{certificate}/{approval}`
- **Public Access**: Siapa saja bisa scan dan verify
- **Detailed Info**: Nama, jabatan, NIP, tanggal tanda tangan, status

### 4. PDF Generation
- **Auto-Generate**: PDF dibuat otomatis saat semua approval selesai
- **Manual Regenerate**: Admin bisa regenerate PDF kapan saja
- **Signature Display**: QR codes ditampilkan di bagian bawah PDF
- **Styling**: Professional layout dengan Times New Roman font

## Technical Implementation

### Database Structure

#### letter_approvals table
```sql
- id
- letter_id
- user_id
- signature_index
- position_name
- status (pending/approved/rejected)
- notes
- signed_at
- signature_data (JSON: certificate_id, signature_hash)
- order
```

#### letter_certificates table
```sql
- id
- certificate_id (unique)
- letter_id
- document_hash
- signed_by (user_id)
- signer_name
- signer_position
- signer_nip
- signed_at
- metadata (JSON: approval_id, ip_address, etc)
- status (valid/revoked)
```

### Services

#### CertificateService
```php
// Generate certificate untuk approval
generateCertificate(Letter $letter, User $signer, int $approvalId)

// Generate signature hash
generateSignatureHash(int $approvalId, int $userId, string $letterNumber)

// Generate QR code untuk approval
generateApprovalQRCode(string $certificateId, int $approvalId)
generateApprovalQRCodeBase64(string $certificateId, int $approvalId)

// Verify certificate
verifyCertificate(string $certificateId)
```

#### PDFService
```php
// Generate PDF dengan multiple signatures
generatePDF(Letter $letter, array $approvalSignatures = [])

// Download PDF
downloadPDF(Letter $letter)
```

### Controllers

#### LetterController
```php
// Individual approval
approve(Request $request, Letter $letter)

// Private method untuk generate PDF
generateLetterPDF(Letter $letter)

// Regenerate PDF manual
regeneratePDF(Letter $letter)
```

#### CertificateController
```php
// Verify certificate (public)
verify(string $certificateId)

// Verify signature dengan approval detail (public)
verifySignature(string $certificateId, int $approvalId)
```

## Workflow

### 1. Surat Dibuat (Draft)
```
User membuat surat → Status: draft
```

### 2. Submit untuk Approval
```
User submit surat → 
  - Status: pending_approval
  - Auto-create LetterApproval records dari signatures di template content
  - Kirim notifikasi ke semua approvers
```

### 3. Approval Process (Sequential)
```
Approver 1 approve →
  - Generate Certificate untuk Approver 1
  - Generate Signature Hash
  - Update approval status: approved
  - Save signature_data (certificate_id, hash)
  
Approver 2 approve →
  - Generate Certificate untuk Approver 2
  - Generate Signature Hash
  - Update approval status: approved
  - Save signature_data (certificate_id, hash)
  
... dst untuk semua approvers
```

### 4. Semua Approval Selesai
```
Last approver approve →
  - Update letter status: approved
  - Generate PDF dengan semua signatures:
    * Load all approved approvals
    * Generate QR code untuk setiap approval
    * Render PDF dengan signature boxes
    * Save PDF path ke letter.pdf_path
```

### 5. Verifikasi Signature
```
User scan QR code →
  - Redirect ke /verify-signature/{certificate}/{approval}
  - Tampilkan:
    * Nama penanda tangan
    * Jabatan
    * NIP
    * Tanggal tanda tangan
    * Status certificate (valid/revoked)
    * Hash validation
    * Informasi surat (nomor, perihal)
```

## API Endpoints

### Protected Routes (Auth Required)
```
POST /arsip/letters/{letter}/approve             - Approve surat (individual)
POST /arsip/letters/{letter}/regenerate-pdf      - Regenerate PDF
GET  /arsip/letters/{letter}/download-pdf        - Download PDF
```

### Public Routes (No Auth)
```
GET /verify/{certificateId}                      - Verify certificate
GET /verify-signature/{certificate}/{approval}   - Verify signature dengan detail approval
```

## PDF Template

### Structure (letter.blade.php)
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Tab support */
        body { white-space: pre-wrap; tab-size: 20; }
        
        /* Empty paragraph compression */
        p:empty { margin: 0.25em 0; line-height: 0.5; }
        
        /* Signature boxes */
        .signature-box {
            display: inline-block;
            text-align: center;
            min-width: 180px;
        }
        
        .signature-box .qr-code {
            width: 56px;
            height: 56px;
            border: 1px solid #333;
        }
    </style>
</head>
<body>
    <!-- Letter content -->
    {!! $letter->rendered_html !!}
    
    <!-- Approval signatures -->
    @foreach($approvalSignatures as $signature)
        <div class="signature-box">
            <img src="data:image/png;base64,{{ $signature['qr_code'] }}" />
            <div>{{ $signature['signer_name'] }}</div>
            <div>{{ $signature['position'] }}</div>
            <div>NIP: {{ $signature['nip'] }}</div>
            <div>{{ $signature['signed_at'] }}</div>
            <div>ID: {{ $signature['certificate_id'] }}</div>
        </div>
    @endforeach
</body>
</html>
```

## Frontend Components

### letters/show.tsx
```tsx
// Tombol Download PDF
{letter.pdf_path && (
    <Button onClick={() => window.open(`/arsip/letters/${letter.id}/download-pdf`)}>
        Download PDF
    </Button>
)}

// Tombol Regenerate PDF (admin only, approved letters)
{letter.status === 'approved' && (
    <Button onClick={() => router.post(`/arsip/letters/${letter.id}/regenerate-pdf`)}>
        Regenerate PDF
    </Button>
)}

// Tombol Approve (untuk approver)
{canApprove && userApproval?.status === 'pending' && (
    <Button onClick={() => handleApprove()}>
        Setujui
    </Button>
)}
```

### verify-signature.tsx
```tsx
// Public page untuk verifikasi signature
- Status icon (✓/✗)
- Informasi penanda tangan (nama, jabatan, NIP)
- Tanggal tanda tangan
- Signature hash
- Informasi surat (nomor, perihal)
- Certificate ID
- Status certificate (valid/revoked)
```

## Security Features

### 1. Hash Verification
- **Document Hash**: Memastikan content surat tidak berubah
- **Signature Hash**: Unique hash per approval
- **SHA-256**: Industry standard cryptographic hash

### 2. Certificate Status
- **Valid**: Certificate aktif dan sah
- **Revoked**: Certificate dicabut (tidak sah lagi)
- **Timestamp**: Immutable timestamp saat signing

### 3. Metadata Tracking
```json
{
    "approval_id": 123,
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "letter_number": "001/SK/2025",
    "letter_date": "2025-11-01"
}
```

### 4. Public Verification
- QR code bisa di-scan oleh siapa saja
- Verification page public (no auth required)
- Transparent audit trail

## Usage Examples

### 1. Membuat Surat dengan Signatures
```typescript
// Di template editor, insert signature nodes
editor.insertSignature({
    userId: 1,
    userName: "John Doe",
    position: "Kepala Bagian",
    nip: "199001012020011001"
});

// Signature akan muncul sebagai inline node (56x56px box)
// Data tersimpan di content JSON dan di signatures field
```

### 2. Approve Surat
```typescript
// Approver click tombol "Setujui"
router.post(`/arsip/letters/${letterId}/approve`, {
    notes: "Disetujui"
});

// Backend akan:
// - Generate certificate
// - Generate signature hash
// - Update approval status
// - Auto-generate PDF jika semua approval selesai
```

### 3. Verify Signature via QR
```
1. User scan QR code di PDF
2. Redirect ke: /verify-signature/{certificate}/{approval}
3. Page menampilkan:
   - ✓ Valid / ✗ Invalid
   - Nama: John Doe
   - Jabatan: Kepala Bagian
   - NIP: 199001012020011001
   - Ditandatangani: 1 November 2025 14:30
   - Certificate ID: CERT-2025-00123
   - Surat: 001/SK/2025 - Surat Keputusan Pengangkatan
```

### 4. Regenerate PDF
```typescript
// Admin regenerate PDF (misalnya ada update layout)
router.post(`/arsip/letters/${letterId}/regenerate-pdf`);

// PDF akan di-generate ulang dengan:
// - Content terbaru dari letter.rendered_html
// - Semua signatures dengan QR codes
// - Updated timestamp
```

## Testing

### Manual Test Checklist
- [ ] Create surat dengan 2+ signatures di template
- [ ] Submit untuk approval
- [ ] Approve sebagai user pertama → Check certificate generated
- [ ] Approve sebagai user kedua → Check PDF auto-generated
- [ ] Download PDF → Check signatures muncul dengan QR codes
- [ ] Scan QR code → Check verification page tampil benar
- [ ] Test regenerate PDF → Check PDF ter-update
- [ ] Test revoke certificate → Check verification page show "revoked"

## Troubleshooting

### PDF tidak generate otomatis
```php
// Check di LetterController::approve()
// Pastikan kondisi ini true:
$allApproved = $letter->approvals()->where('status', '!=', 'approved')->count() === 0;

// Check logs:
Log::info('Approval Status', [
    'letter_id' => $letter->id,
    'total_approvals' => $letter->approvals()->count(),
    'approved_count' => $letter->approvals()->where('status', 'approved')->count(),
]);
```

### QR code tidak muncul di PDF
```php
// Check signature data:
$signatureData = json_decode($approval->signature_data, true);
Log::info('Signature Data', $signatureData);

// Check QR code generation:
$qrCode = $this->certificateService->generateApprovalQRCodeBase64($certificateId, $approvalId);
Log::info('QR Code Length', ['length' => strlen($qrCode)]);
```

### Verification page error
```php
// Check route exists:
php artisan route:list | grep verify-signature

// Check approval data:
$approval = LetterApproval::find($approvalId);
Log::info('Approval Data', ['approval' => $approval]);
```

## Future Enhancements
- [ ] Blockchain integration untuk immutable audit trail
- [ ] Advanced certificate authority (CA) integration
- [ ] Biometric signature support
- [ ] Batch PDF generation
- [ ] Email notification dengan PDF attachment
- [ ] Mobile app untuk signing
- [ ] OCR untuk scan fisik signature
- [ ] Integration dengan e-Materai

## Maintenance Notes
- Certificates disimpan permanent (jangan di-delete)
- PDF files di storage/app/public/letters/
- Backup database regular (terutama certificates table)
- Monitor disk space untuk PDF files
- Archive old letters setelah retention period
