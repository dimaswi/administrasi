<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LetterSignatory extends Model
{
    protected $fillable = [
        'letter_id',
        'user_id',
        'slot_id',
        'sign_order',
        'status',
        'signed_at',
        'signature_image',
        'rejection_reason',
        'certificate_id',
        'document_hash',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
        'sign_order' => 'integer',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    // Relationships
    public function letter(): BelongsTo
    {
        return $this->belongsTo(OutgoingLetter::class, 'letter_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Approve/Sign the letter
     */
    public function approve(?string $signatureImage = null): void
    {
        $certificateId = 'LTR-' . strtoupper(substr(md5($this->letter_id . $this->user_id . time()), 0, 12));
        
        $documentHash = hash('sha256', json_encode([
            'letter_id' => $this->letter_id,
            'user_id' => $this->user_id,
            'slot_id' => $this->slot_id,
            'signed_at' => now()->format('Y-m-d H:i:s'),
        ]));

        $this->update([
            'status' => self::STATUS_APPROVED,
            'signed_at' => now(),
            'signature_image' => $signatureImage,
            'certificate_id' => $certificateId,
            'document_hash' => $documentHash,
        ]);

        // Update letter status
        $this->letter->updateStatusFromSignatories();
    }

    /**
     * Reject the letter
     */
    public function reject(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
            'rejection_reason' => $reason,
        ]);

        // Update letter status
        $this->letter->updateStatusFromSignatories();
    }

    /**
     * Check if this signatory can sign now
     */
    public function canSign(): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }

        // Check if previous signatories have signed
        $pendingBefore = $this->letter->signatories()
            ->where('sign_order', '<', $this->sign_order)
            ->where('status', self::STATUS_PENDING)
            ->count();

        return $pendingBefore === 0;
    }

    /**
     * Get signature slot info from template
     */
    public function getSlotInfo(): ?array
    {
        $template = $this->letter->template;
        $slots = $template->signature_settings['slots'] ?? [];
        
        foreach ($slots as $slot) {
            if ($slot['id'] === $this->slot_id) {
                return $slot;
            }
        }
        
        return null;
    }
}
