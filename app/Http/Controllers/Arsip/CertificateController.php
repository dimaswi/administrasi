<?php

namespace App\Http\Controllers\Arsip;

use App\Http\Controllers\Controller;
use App\Models\LetterCertificate;
use App\Services\CertificateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CertificateController extends Controller
{
    private CertificateService $certificateService;

    public function __construct(CertificateService $certificateService)
    {
        $this->certificateService = $certificateService;
    }

    /**
     * Verify certificate (public route)
     */
    public function verify(string $certificateId)
    {
        $result = $this->certificateService->verifyCertificate($certificateId);

        return Inertia::render('arsip/verify-certificate', [
            'result' => $result,
        ]);
    }
    
    /**
     * Verify signature on approval (public route)
     */
    public function verifySignature(string $certificateId, int $approvalId)
    {
        $result = $this->certificateService->verifyCertificate($certificateId);
        
        // Load approval data
        $approval = \App\Models\LetterApproval::with(['user', 'letter'])
            ->find($approvalId);
        
        if ($approval) {
            $signatureData = json_decode($approval->signature_data, true);
            
            $result['approval'] = [
                'id' => $approval->id,
                'signer_name' => $approval->user->name,
                'position' => $approval->position_name,
                'nip' => $approval->user->nip,
                'signed_at' => $approval->signed_at,
                'status' => $approval->status,
                'letter_number' => $approval->letter->letter_number,
                'letter_subject' => $approval->letter->subject,
                'signature_hash' => $signatureData['signature_hash'] ?? null,
            ];
        }

        return Inertia::render('arsip/verify-signature', [
            'result' => $result,
        ]);
    }

    /**
     * Revoke certificate
     */
    public function revoke(Request $request, LetterCertificate $certificate)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if ($certificate->status === 'revoked') {
            return back()->with('error', 'Sertifikat sudah dicabut');
        }

        $this->certificateService->revokeCertificate(
            $certificate,
            $validated['reason'],
            Auth::id()
        );

        return back()->with('success', 'Sertifikat berhasil dicabut');
    }

    /**
     * Download QR Code
     */
    public function downloadQRCode(LetterCertificate $certificate)
    {
        $qrCode = $this->certificateService->generateQRCode($certificate);

        return response($qrCode)
            ->header('Content-Type', 'image/png')
            ->header('Content-Disposition', 'attachment; filename="qrcode-' . $certificate->certificate_id . '.png"');
    }
}
