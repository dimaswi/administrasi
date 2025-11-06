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

        // Debug: Save HTML untuk cek
        $htmlPath = storage_path("app/public/letters/debug-{$letter->id}.html");
        file_put_contents($htmlPath, $html);
        Log::info("PDF HTML saved for debug", [
            'html_path' => $htmlPath,
            'has_qr_in_html' => strpos($html, 'data:image/png;base64') !== false,
            'html_length' => strlen($html),
        ]);

        // Generate PDF using DomPDF
        // Set options DULU sebelum loadHTML agar base64 images ter-render
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'enable_php' => false,
            'chroot' => public_path(),
        ]);
        
        $pdf->loadHTML($html);
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
        
        // Replace text "QR" dengan QR code image - KEEP semua wrapper HTML
        // Support both old signature (span) and new signatureBlock (div)
        foreach ($approvalSignatures as $signature) {
            if (isset($signature['qr_code']) && isset($signature['user_id'])) {
                $userId = $signature['user_id'];
                $userName = $signature['signer_name'];
                $qrBase64 = $signature['qr_code'];
                
                // Generate QR image tag
                $qrImage = '<img src="data:image/png;base64,' . $qrBase64 . '" style="width: 80px; height: 80px; display: block; margin: 0 auto;" alt="QR" />';
                
                // Pattern 1: Old signature (span-based)
                $pattern1 = '/<span([^>]*data-user-id="' . $userId . '"[^>]*)>(.*?)<\/span>\s*<\/span>/is';
                
                // Pattern 2: New signatureBlock (div-based)
                $pattern2 = '/<div([^>]*data-type="signature-block"[^>]*data-user-id="' . $userId . '"[^>]*)>(.*?)<\/div>/is';
                
                $replaced = false;
                
                // Try pattern 1 (old signature)
                if (preg_match($pattern1, $html, $matches)) {
                    $fullMatch = $matches[0];
                    $outerAttributes = $matches[1];
                    $innerContent = $matches[2];
                    
                    // Replace ">QR<" inside nested spans dengan img tag
                    $newContent = preg_replace('/>QR</', '>' . $qrImage . '<', $innerContent, 1);
                    
                    // Reconstruct spans
                    $newSpan = '<span' . $outerAttributes . '>' . $newContent . '</span></span>';
                    
                    // Replace di HTML
                    $html = str_replace($fullMatch, $newSpan, $html);
                    $replaced = true;
                    
                    Log::info('PDF QR Replaced (old signature)', [
                        'user_id' => $userId,
                        'user_name' => $userName,
                        'certificate_id' => $signature['certificate_id'] ?? 'N/A',
                    ]);
                } 
                // Try pattern 2 (new signatureBlock)
                else if (preg_match($pattern2, $html, $matches)) {
                    $fullMatch = $matches[0];
                    $divAttributes = $matches[1];
                    $innerContent = $matches[2];
                    
                    // Replace ">QR<" inside div dengan img tag
                    $newContent = preg_replace('/>QR</', '>' . $qrImage . '<', $innerContent, 1);
                    
                    // Reconstruct div
                    $newDiv = '<div' . $divAttributes . '>' . $newContent . '</div>';
                    
                    // Replace di HTML
                    $html = str_replace($fullMatch, $newDiv, $html);
                    $replaced = true;
                    
                    Log::info('PDF QR Replaced (new signatureBlock)', [
                        'user_id' => $userId,
                        'user_name' => $userName,
                        'certificate_id' => $signature['certificate_id'] ?? 'N/A',
                    ]);
                }
                
                if (!$replaced) {
                    Log::warning('PDF: Could not find signature container for user', [
                        'user_id' => $userId,
                        'user_name' => $userName,
                        'html_snippet' => substr($html, 0, 500),
                    ]);
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
        
        // Return HTML dengan margin yang lebih kecil dan tanpa border
        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            box-shadow: none !important;
        }
        body {
            margin: 0;
            padding: 15mm;
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.5;
        }
        /* Remove borders and shadows from all elements */
        table, td, th, div, p, span, img {
            border: none !important;
            box-shadow: none !important;
        }
        /* Page break styling */
        div[data-type="page-break"] {
            page-break-after: always;
            height: 0;
            margin: 0;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
        }
    </style>
</head>
<body>' . $html . '</body>
</html>';
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
