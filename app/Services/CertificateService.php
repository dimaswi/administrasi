<?php

namespace App\Services;

use App\Models\Letter;
use App\Models\LetterCertificate;
use App\Models\User;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateService
{
    /**
     * Generate certificate for a letter
     */
    public function generateCertificate(Letter $letter, User $signer): LetterCertificate
    {
        // Generate unique certificate ID
        $certificateId = $this->generateCertificateId();

        // Generate document hash
        $documentHash = $this->generateDocumentHash($letter);

        // Create certificate
        $certificate = LetterCertificate::create([
            'certificate_id' => $certificateId,
            'letter_id' => $letter->id,
            'document_hash' => $documentHash,
            'signed_by' => $signer->id,
            'signer_name' => $signer->name,
            'signer_position' => $signer->position ?? 'Staff',
            'signer_nip' => $signer->nip,
            'signed_at' => now(),
            'metadata' => [
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'letter_number' => $letter->letter_number,
                'letter_date' => $letter->letter_date->toDateString(),
            ],
            'status' => 'valid',
        ]);

        return $certificate;
    }

    /**
     * Generate unique certificate ID
     */
    private function generateCertificateId(): string
    {
        $year = date('Y');
        $count = LetterCertificate::whereYear('created_at', $year)->count() + 1;
        
        return 'CERT-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Generate document hash
     */
    public function generateDocumentHash(Letter $letter): string
    {
        return hash('sha256', json_encode([
            'letter_id' => $letter->id,
            'letter_number' => $letter->letter_number,
            'subject' => $letter->subject,
            'content' => $letter->rendered_html,
            'created_at' => $letter->created_at->toISOString(),
        ]));
    }

    /**
     * Generate QR Code for certificate
     */
    public function generateQRCode(LetterCertificate $certificate): string
    {
        $verificationUrl = route('verify.certificate', ['id' => $certificate->certificate_id]);

        return QrCode::format('png')
            ->size(200)
            ->errorCorrection('H')
            ->generate($verificationUrl);
    }

    /**
     * Generate QR Code as base64
     */
    public function generateQRCodeBase64(LetterCertificate $certificate): string
    {
        $qrCode = $this->generateQRCode($certificate);
        return base64_encode($qrCode);
    }

    /**
     * Verify certificate
     */
    public function verifyCertificate(string $certificateId): array
    {
        $certificate = LetterCertificate::where('certificate_id', $certificateId)
            ->with(['letter', 'signer'])
            ->first();

        if (!$certificate) {
            return [
                'valid' => false,
                'message' => 'Sertifikat tidak ditemukan',
                'certificate' => null,
            ];
        }

        // Verify document hash
        $currentHash = $this->generateDocumentHash($certificate->letter);
        $hashValid = $currentHash === $certificate->document_hash;

        // Check if revoked
        $isRevoked = $certificate->status === 'revoked';

        $isValid = $hashValid && !$isRevoked;

        return [
            'valid' => $isValid,
            'message' => $this->getVerificationMessage($isValid, $isRevoked, $hashValid),
            'certificate' => $certificate,
            'hash_valid' => $hashValid,
            'is_revoked' => $isRevoked,
        ];
    }

    /**
     * Get verification message
     */
    private function getVerificationMessage(bool $isValid, bool $isRevoked, bool $hashValid): string
    {
        if ($isRevoked) {
            return 'Sertifikat telah dicabut';
        }

        if (!$hashValid) {
            return 'Dokumen telah dimodifikasi atau tidak valid';
        }

        if ($isValid) {
            return 'Dokumen valid dan terverifikasi';
        }

        return 'Dokumen tidak valid';
    }

    /**
     * Revoke certificate
     */
    public function revokeCertificate(LetterCertificate $certificate, string $reason, int $userId): bool
    {
        return $certificate->revoke($reason, $userId);
    }
}
