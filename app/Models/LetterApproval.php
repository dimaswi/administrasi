<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LetterApproval extends Model
{
    protected $fillable = [
        'letter_id',
        'user_id',
        'signature_index',
        'position_name',
        'status',
        'notes',
        'signed_at',
        'signature_data',
        'order',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    // Relationships
    public function letter(): BelongsTo
    {
        return $this->belongsTo(Letter::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function approve(string $notes = null, string $signatureData = null): void
    {
        $this->update([
            'status' => 'approved',
            'notes' => $notes,
            'signature_data' => $signatureData,
            'signed_at' => now(),
        ]);

        // Update letter approval status
        $this->letter->updateApprovalStatus();

        // Send notification to letter creator
        $this->sendApprovalNotification();
    }

    public function reject(string $notes): void
    {
        $this->update([
            'status' => 'rejected',
            'notes' => $notes,
            'signed_at' => now(),
        ]);

        // Update letter status to rejected
        $this->letter->update(['status' => 'rejected']);

        // Send notification to letter creator
        $this->sendRejectionNotification();
    }

    private function sendApprovalNotification(): void
    {
        Notification::create([
            'user_id' => $this->letter->created_by,
            'type' => 'letter_approved',
            'title' => 'Surat Disetujui',
            'message' => "{$this->user->name} telah menyetujui surat {$this->letter->letter_number}",
            'data' => [
                'letter_id' => $this->letter->id,
                'approval_id' => $this->id,
            ],
            'action_url' => "/letters/{$this->letter->id}",
        ]);
    }

    private function sendRejectionNotification(): void
    {
        Notification::create([
            'user_id' => $this->letter->created_by,
            'type' => 'letter_rejected',
            'title' => 'Surat Ditolak',
            'message' => "{$this->user->name} menolak surat {$this->letter->letter_number}. Alasan: {$this->notes}",
            'data' => [
                'letter_id' => $this->letter->id,
                'approval_id' => $this->id,
            ],
            'action_url' => "/letters/{$this->letter->id}",
        ]);
    }
}
