<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DispositionFollowUp extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'disposition_id',
        'follow_up_date',
        'follow_up_type',
        'description',
        'file_path',
        'outgoing_letter_id',
        'meeting_id',
        'status',
        'created_by',
    ];

    protected $casts = [
        'follow_up_date' => 'date',
    ];

    // Relationships
    public function disposition(): BelongsTo
    {
        return $this->belongsTo(Disposition::class, 'disposition_id');
    }

    public function outgoingLetter(): BelongsTo
    {
        return $this->belongsTo(Letter::class, 'outgoing_letter_id');
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class, 'meeting_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('follow_up_type', $type);
    }

    // Helper methods
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function getFollowUpTypeLabel(): string
    {
        return match($this->follow_up_type) {
            'surat_balasan' => 'Surat Balasan',
            'rapat' => 'Rapat/Pertemuan',
            'kunjungan' => 'Kunjungan',
            'telepon' => 'Telepon/Email',
            'tidak_perlu' => 'Tidak Perlu Tindak Lanjut',
            'lainnya' => 'Lainnya',
            default => $this->follow_up_type,
        };
    }
}
