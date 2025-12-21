<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Archive extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type',
        'incoming_letter_id',
        'outgoing_letter_id',
        'document_number',
        'title',
        'description',
        'category',
        'document_date',
        'document_type',
        'file_path',
        'file_type',
        'file_size',
        'sender',
        'recipient',
        'classification',
        'retention_period',
        'retention_until',
        'tags',
        'metadata',
        'archived_by',
    ];

    protected $casts = [
        'document_date' => 'date',
        'retention_until' => 'date',
        'tags' => 'array',
        'metadata' => 'array',
        'file_size' => 'integer',
        'retention_period' => 'integer',
    ];

    public function incomingLetter(): BelongsTo
    {
        return $this->belongsTo(IncomingLetter::class);
    }

    public function outgoingLetter(): BelongsTo
    {
        return $this->belongsTo(OutgoingLetter::class);
    }

    public function archiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByClassification($query, $classification)
    {
        return $query->where('classification', $classification);
    }

    public function scopeExpiringSoon($query, $days = 30)
    {
        return $query->whereNotNull('retention_until')
            ->where('retention_until', '<=', now()->addDays($days))
            ->where('retention_until', '>=', now());
    }

    public function isExpired(): bool
    {
        return $this->retention_until && $this->retention_until->isPast();
    }

    public function getFileSizeHumanAttribute(): string
    {
        if (!$this->file_size) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $this->file_size;
        $unitIndex = 0;

        while ($size >= 1024 && $unitIndex < count($units) - 1) {
            $size /= 1024;
            $unitIndex++;
        }

        return round($size, 2) . ' ' . $units[$unitIndex];
    }
}
