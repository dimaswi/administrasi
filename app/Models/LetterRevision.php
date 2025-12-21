<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LetterRevision extends Model
{
    protected $fillable = [
        'letter_id',
        'version',
        'type',
        'variable_values',
        'rendered_html',
        'pdf_path',
        'revision_notes',
        'requested_changes',
        'created_by',
    ];

    protected $casts = [
        'variable_values' => 'array',
    ];

    // Revision types
    const TYPE_INITIAL = 'initial';
    const TYPE_REVISION_REQUEST = 'revision_request';
    const TYPE_REVISION_SUBMITTED = 'revision_submitted';

    public function letter(): BelongsTo
    {
        return $this->belongsTo(OutgoingLetter::class, 'letter_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get type label
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            self::TYPE_INITIAL => 'Versi Awal',
            self::TYPE_REVISION_REQUEST => 'Permintaan Revisi',
            self::TYPE_REVISION_SUBMITTED => 'Revisi Disubmit',
            default => $this->type,
        };
    }

    /**
     * Get type color for badge
     */
    public function getTypeColorAttribute(): string
    {
        return match($this->type) {
            self::TYPE_INITIAL => 'default',
            self::TYPE_REVISION_REQUEST => 'destructive',
            self::TYPE_REVISION_SUBMITTED => 'success',
            default => 'secondary',
        };
    }
}
