<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LetterNumberingConfig extends Model
{
    protected $fillable = [
        'code',
        'name',
        'format',
        'prefix_codes',
        'counter_reset',
        'last_number',
        'year',
        'month',
        'padding',
        'is_active',
    ];

    protected $casts = [
        'prefix_codes' => 'array',
        'last_number' => 'integer',
        'year' => 'integer',
        'month' => 'integer',
        'padding' => 'integer',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getNextNumber(): int
    {
        $currentYear = date('Y');
        $currentMonth = date('m');

        // Check if reset is needed
        if ($this->counter_reset === 'yearly' && $this->year != $currentYear) {
            $this->update([
                'last_number' => 1,
                'year' => $currentYear,
                'month' => $currentMonth,
            ]);
            return 1;
        }

        if ($this->counter_reset === 'monthly' && ($this->month != $currentMonth || $this->year != $currentYear)) {
            $this->update([
                'last_number' => 1,
                'year' => $currentYear,
                'month' => $currentMonth,
            ]);
            return 1;
        }

        // Increment number
        $nextNumber = $this->last_number + 1;
        $this->update([
            'last_number' => $nextNumber,
            'year' => $currentYear,
            'month' => $currentMonth,
        ]);

        return $nextNumber;
    }

    public function formatNumber(int $number, array $replacements = []): string
    {
        $formatted = $this->format;

        // Replace number with padding
        $paddedNumber = str_pad($number, $this->padding, '0', STR_PAD_LEFT);
        $formatted = str_replace('XXX', $paddedNumber, $formatted);

        // Replace variables
        foreach ($replacements as $key => $value) {
            $formatted = str_replace("{{{$key}}}", $value, $formatted);
        }

        // Replace default date variables
        $formatted = str_replace('{{month}}', $this->romanMonth(date('n')), $formatted);
        $formatted = str_replace('{{year}}', date('Y'), $formatted);

        return $formatted;
    }

    private function romanMonth(int $month): string
    {
        $romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return $romanNumerals[$month - 1] ?? 'I';
    }
}
