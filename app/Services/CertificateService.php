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
    public function generateCertificate(Letter $letter, User $signer, int $approvalId = null): LetterCertificate
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
                'approval_id' => $approvalId,
            ],
            'status' => 'valid',
        ]);

        return $certificate;
    }
    
    /**
     * Generate signature hash for approval
     */
    public function generateSignatureHash(int $approvalId, int $userId, string $letterNumber): string
    {
        return hash('sha256', json_encode([
            'approval_id' => $approvalId,
            'user_id' => $userId,
            'letter_number' => $letterNumber,
            'timestamp' => now()->toISOString(),
        ]));
    }
    
    /**
     * Generate QR Code for approval signature
     */
    public function generateApprovalQRCode(string $certificateId, int $approvalId): string
    {
        $verificationUrl = route('verify.signature', [
            'certificate' => $certificateId,
            'approval' => $approvalId
        ]);

        return QrCode::format('png')
            ->size(150)
            ->errorCorrection('H')
            ->generate($verificationUrl);
    }
    
    /**
     * Generate QR Code for approval as base64
     */
    public function generateApprovalQRCodeBase64(string $certificateId, int $approvalId): string
    {
        $qrCode = $this->generateApprovalQRCode($certificateId, $approvalId);
        return base64_encode($qrCode);
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

        // Check if this is a meeting certificate
        $isMeetingCertificate = isset($certificate->metadata['type']) && $certificate->metadata['type'] === 'meeting_invitation';
        
        // Verify document hash
        if ($isMeetingCertificate) {
            // For meeting certificates, we verify against meeting data
            $meeting = \App\Models\Meeting::find($certificate->metadata['meeting_id']);
            if ($meeting) {
                $currentHash = hash('sha256', json_encode([
                    'meeting_id' => $meeting->id,
                    'meeting_number' => $meeting->meeting_number,
                    'title' => $meeting->title,
                    'meeting_date' => $meeting->meeting_date->format('Y-m-d H:i:s'),
                    'signed_by' => $certificate->signed_by,
                    'signed_at' => $certificate->signed_at->format('Y-m-d H:i:s'),
                ]));
                $hashValid = $currentHash === $certificate->document_hash;
            } else {
                $hashValid = false;
            }
        } else {
            // For letter certificates
            $currentHash = $this->generateDocumentHash($certificate->letter);
            $hashValid = $currentHash === $certificate->document_hash;
        }

        // Check if revoked
        $isRevoked = $certificate->status === 'revoked';

        $isValid = $hashValid && !$isRevoked;

        $result = [
            'valid' => $isValid,
            'message' => $this->getVerificationMessage($isValid, $isRevoked, $hashValid),
            'certificate' => $certificate,
            'hash_valid' => $hashValid,
            'is_revoked' => $isRevoked,
            'is_meeting_certificate' => $isMeetingCertificate,
        ];

        // Add meeting data if it's a meeting certificate
        if ($isMeetingCertificate && isset($meeting)) {
            $meeting->load(['room', 'organizer', 'organizationUnit']);
            $result['meeting'] = $meeting;
        }

        return $result;
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
