<?php

namespace App\Services;

use App\Models\Letter;
use App\Models\LetterCertificate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Spatie\Browsershot\Browsershot;

class PDFService
{
    private CertificateService $certificateService;

    public function __construct(CertificateService $certificateService)
    {
        $this->certificateService = $certificateService;
    }

    /**
     * Generate PDF from letter with signatures
     */
    public function generatePDF(Letter $letter, array $approvalSignatures = []): string
    {
        $html = $this->preparePDFHtml($letter, $approvalSignatures);
        
        $filename = $this->generateFilename($letter);
        $path = "letters/{$filename}";
        $fullPath = storage_path("app/public/{$path}");

        // Ensure directory exists
        $directory = dirname($fullPath);
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        // Generate PDF using DomPDF
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('a4', 'portrait');
        $pdf->save($fullPath);

        return $path;
    }

    /**
     * Prepare HTML for PDF with styling and signatures
     */
    private function preparePDFHtml(Letter $letter, array $approvalSignatures = []): string
    {
        $html = $letter->rendered_html;
        
        // Replace signature placeholders with actual QR codes
        foreach ($approvalSignatures as $signature) {
            $userId = $signature['user_id'] ?? null;
            if ($userId && isset($signature['qr_code'])) {
                // QR code image replacement
                $qrImage = '<img src="data:image/png;base64,' . $signature['qr_code'] . '" style="width: 56px; height: 56px; display: inline-block; vertical-align: middle; border: 1px solid #333; margin: 0 2px;" alt="QR" />';
                
                // Try multiple patterns to match signature spans (can be self-closing or empty)
                $patterns = [
                    // Pattern 1: Self-closing span
                    '/<span[^>]*data-type="signature"[^>]*data-user-id="' . $userId . '"[^>]*\/>/i',
                    // Pattern 2: Empty span with data-type first
                    '/<span[^>]*data-type="signature"[^>]*data-user-id="' . $userId . '"[^>]*><\/span>/i',
                    // Pattern 3: Empty span with data-user-id first
                    '/<span[^>]*data-user-id="' . $userId . '"[^>]*data-type="signature"[^>]*><\/span>/i',
                    // Pattern 4: Span with any content (fallback)
                    '/<span[^>]*data-type="signature"[^>]*data-user-id="' . $userId . '"[^>]*>.*?<\/span>/is',
                ];
                
                foreach ($patterns as $pattern) {
                    $count = 0;
                    $html = preg_replace($pattern, $qrImage, $html, -1, $count);
                    if ($count > 0) {
                        Log::info("PDF: Replaced {$count} signature(s) for user {$userId}");
                        break;
                    }
                }
            }
        }
        
        // Remove any remaining signature placeholders that weren't replaced
        $html = preg_replace('/<span[^>]*data-type="signature"[^>]*>.*?<\/span>/is', '', $html);
        
        // Replace text-based signatures in content with QR codes (keep CSS wrapper)
        foreach ($approvalSignatures as $signature) {
            if (isset($signature['qr_code']) && isset($signature['signer_name'])) {
                $userName = $signature['signer_name'];
                
                // Replace entire <span>QR</span> with QR image (ganti seluruh span, bukan hanya teks)
                // Pattern untuk struktur: <span><span>Label</span><span>QR</span><span>Nama</span></span>
                $pattern = '/(<span[^>]*>[^<]*<span[^>]*>[^<]*<\/span>[^<]*)<span[^>]*>QR<\/span>([^<]*<span[^>]*>' . preg_quote($userName, '/') . '<\/span><\/span>)/is';
                $replacement = '$1<img src="data:image/png;base64,' . $signature['qr_code'] . '" style="width: 85px; height: 85px; display: block; margin: 4px auto;" alt="QR Code" />$2';
                
                $count = 0;
                $html = preg_replace($pattern, $replacement, $html, 1, $count);
                
                // Remove border from wrapper span (hapus border dari kotak signature)
                if ($count > 0) {
                    // Remove "border: 1px solid ..." from the outermost span
                    $html = preg_replace(
                        '/(<span[^>]*style="[^"]*?)border:\s*1px\s+solid[^;]*;?([^"]*")/is',
                        '$1$2',
                        $html
                    );
                }
                
                if ($count > 0) {
                    Log::info("PDF: Replaced text QR with image for {$userName}");
                }
            }
        }
        
        // If no signatures were embedded in content (old template), append QR codes at bottom
        if (count($approvalSignatures) > 0 && strpos($html, '<img src="data:image/png;base64,') === false) {
            $html .= '<div style="margin-top: 40px; text-align: right; padding-right: 80px;">';
            foreach ($approvalSignatures as $signature) {
                if (isset($signature['qr_code'])) {
                    $html .= '<div style="display: inline-block; text-align: center; margin: 0 10px; vertical-align: top;">';
                    $html .= '<div style="margin-bottom: 50px; font-size: 12px; min-height: 20px;"></div>';
                    $html .= '<img src="data:image/png;base64,' . $signature['qr_code'] . '" style="width: 80px; height: 80px; border: 1px solid #333; display: block; margin: 0 auto;" alt="QR" />';
                    $html .= '<div style="margin-top: 5px; font-size: 12px; font-weight: bold; text-decoration: underline;">' . $signature['signer_name'] . '</div>';
                    $html .= '<div style="font-size: 11px; color: #333;">' . $signature['position'] . '</div>';
                    if (!empty($signature['nip'])) {
                        $html .= '<div style="font-size: 10px; color: #666;">NIP: ' . $signature['nip'] . '</div>';
                    }
                    $html .= '</div>';
                }
            }
            $html .= '</div>';
        }
        
        return view('pdf.letter', [
            'letter' => (object)['rendered_html' => $html, 'letter_number' => $letter->letter_number],
            'approvalSignatures' => [],
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

        // Clean filename - remove / \ and other invalid characters
        $filename = str_replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], '-', $letter->letter_number) . '.pdf';
        
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
