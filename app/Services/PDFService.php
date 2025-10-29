<?php

namespace App\Services;

use App\Models\Letter;
use App\Models\LetterCertificate;
use Illuminate\Support\Facades\Storage;
use Spatie\Browsershot\Browsershot;

class PDFService
{
    private CertificateService $certificateService;

    public function __construct(CertificateService $certificateService)
    {
        $this->certificateService = $certificateService;
    }

    /**
     * Generate PDF from letter
     */
    public function generatePDF(Letter $letter, LetterCertificate $certificate = null): string
    {
        $html = $this->preparePDFHtml($letter, $certificate);
        
        $filename = $this->generateFilename($letter);
        $path = "letters/{$filename}";
        $fullPath = storage_path("app/public/{$path}");

        // Ensure directory exists
        $directory = dirname($fullPath);
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        // Generate PDF using DomPDF (fallback)
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('a4', 'portrait');
        $pdf->save($fullPath);

        return $path;
    }

    /**
     * Prepare HTML for PDF with styling
     */
    private function preparePDFHtml(Letter $letter, ?LetterCertificate $certificate): string
    {
        $qrCodeBase64 = null;
        if ($certificate) {
            $qrCodeBase64 = $this->certificateService->generateQRCodeBase64($certificate);
        }

        return view('pdf.letter', [
            'letter' => $letter,
            'certificate' => $certificate,
            'qrCode' => $qrCodeBase64,
        ])->render();
    }

    /**
     * Generate filename for PDF
     */
    private function generateFilename(Letter $letter): string
    {
        $letterNumber = str_replace(['/', '\\', ' '], '-', $letter->letter_number);
        return $letterNumber . '-' . time() . '.pdf';
    }

    /**
     * Get PDF URL
     */
    public function getPDFUrl(string $path): string
    {
        return Storage::url($path);
    }

    /**
     * Download PDF
     */
    public function downloadPDF(Letter $letter): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        if (!$letter->pdf_path) {
            throw new \Exception('PDF not generated yet');
        }

        $fullPath = storage_path("app/public/{$letter->pdf_path}");
        
        if (!file_exists($fullPath)) {
            throw new \Exception('PDF file not found');
        }

        $filename = $letter->letter_number . '.pdf';
        
        return response()->download($fullPath, $filename);
    }

    /**
     * Delete PDF file
     */
    public function deletePDF(string $path): bool
    {
        return Storage::disk('public')->delete($path);
    }
}
