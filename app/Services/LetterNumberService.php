<?php

namespace App\Services;

use App\Models\Letter;
use App\Models\LetterTemplate;
use Carbon\Carbon;

class LetterNumberService
{
    /**
     * Generate letter number based on template format
     * 
     * Format placeholders:
     * {{seq}} or {{sequence}} - Sequential number (auto-increment)
     * {{code}} - Template code
     * {{unit}} - Unit/department code (from data)
     * {{month}} - Month in roman numerals (I-XII)
     * {{month_num}} - Month in numbers (01-12)
     * {{year}} - Full year (2025)
     * {{year_short}} - Short year (25)
     * {{day}} - Day (01-31)
     * {{date}} - Full date YYYYMMDD
     * 
     * Example format: {{seq}}/{{code}}/{{unit}}/{{month}}/{{year}}
     * Result: 001/SK/HRD/X/2025
     */
    public function generate(
        LetterTemplate $template, 
        array $data = [], 
        ?Carbon $date = null
    ): string {
        $date = $date ?? now();
        $format = $template->numbering_format;

        // If no format specified, use default
        if (!$format) {
            $format = '{{seq}}/{{code}}/{{month}}/{{year}}';
        }

        // Get next sequence number for this template
        $sequence = $this->getNextSequence($template, $date);

        // Prepare replacements
        $replacements = [
            '{{seq}}' => str_pad($sequence, 3, '0', STR_PAD_LEFT),
            '{{sequence}}' => str_pad($sequence, 3, '0', STR_PAD_LEFT),
            '{{code}}' => $template->code,
            '{{unit}}' => $data['unit'] ?? '',
            '{{month}}' => $this->toRomanMonth($date->month),
            '{{month_num}}' => $date->format('m'),
            '{{year}}' => $date->format('Y'),
            '{{year_short}}' => $date->format('y'),
            '{{day}}' => $date->format('d'),
            '{{date}}' => $date->format('Ymd'),
        ];

        // Replace all placeholders
        $letterNumber = str_replace(
            array_keys($replacements),
            array_values($replacements),
            $format
        );

        // Clean up double slashes if unit is empty
        $letterNumber = preg_replace('#/+#', '/', $letterNumber);
        $letterNumber = trim($letterNumber, '/');

        return $letterNumber;
    }

    /**
     * Get next sequence number for template in current period
     */
    protected function getNextSequence(LetterTemplate $template, Carbon $date): int
    {
        // Get last letter number for this template in current year
        $lastLetter = Letter::where('template_id', $template->id)
            ->whereYear('letter_date', $date->year)
            ->whereMonth('letter_date', $date->month)
            ->orderBy('letter_number', 'desc')
            ->first();

        if (!$lastLetter) {
            return 1;
        }

        // Try to extract sequence number from last letter
        // This is a simple implementation - assumes sequence is at the start
        preg_match('/^(\d+)/', $lastLetter->letter_number, $matches);
        
        if (isset($matches[1])) {
            return (int)$matches[1] + 1;
        }

        // If can't extract, count all letters for this template in period
        return Letter::where('template_id', $template->id)
            ->whereYear('letter_date', $date->year)
            ->whereMonth('letter_date', $date->month)
            ->count() + 1;
    }

    /**
     * Convert month number to Roman numerals
     */
    protected function toRomanMonth(int $month): string
    {
        $romans = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV',
            5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII',
            9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'
        ];

        return $romans[$month] ?? '';
    }

    /**
     * Validate if letter number is unique
     */
    public function isUnique(string $letterNumber, ?int $excludeId = null): bool
    {
        $query = Letter::where('letter_number', $letterNumber);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return !$query->exists();
    }

    /**
     * Preview letter number without saving
     */
    public function preview(
        LetterTemplate $template,
        array $data = [],
        ?Carbon $date = null
    ): string {
        return $this->generate($template, $data, $date);
    }

    /**
     * Get format explanation for user
     */
    public function getFormatExplanation(): array
    {
        return [
            '{{seq}}' => 'Nomor urut otomatis (001, 002, ...)',
            '{{sequence}}' => 'Sama dengan {{seq}}',
            '{{code}}' => 'Kode template (contoh: SK, SPT)',
            '{{unit}}' => 'Kode unit/bagian (harus diisi manual)',
            '{{month}}' => 'Bulan dalam angka romawi (I-XII)',
            '{{month_num}}' => 'Bulan dalam angka (01-12)',
            '{{year}}' => 'Tahun penuh (2025)',
            '{{year_short}}' => 'Tahun 2 digit (25)',
            '{{day}}' => 'Tanggal (01-31)',
            '{{date}}' => 'Tanggal lengkap (YYYYMMDD)',
        ];
    }
}
