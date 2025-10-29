<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LetterCertificate extends Model
{
    protected $fillable = [
        'certificate_id',
        'letter_id',
        'document_hash',
        'signed_by',
        'signer_name',
        'signer_position',
        'signer_nip',
        'signed_at',
        'signature_file',
        'metadata',
        'status',
        'revoked_reason',
        'revoked_by',
        'revoked_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'signed_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function letter(): BelongsTo
    {
        return $this->belongsTo(Letter::class);
    }

    public function signer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by');
    }

    public function revoker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    public function isValid(): bool
    {
        return $this->status === 'valid';
    }

    public function isRevoked(): bool
    {
        return $this->status === 'revoked';
    }

    public function revoke(string $reason, int $userId): bool
    {
        return $this->update([
            'status' => 'revoked',
            'revoked_reason' => $reason,
            'revoked_by' => $userId,
            'revoked_at' => now(),
        ]);
    }

    public function verifyHash(): bool
    {
        // Verify document hash matches the current letter data
        $currentHash = hash('sha256', json_encode([
            'letter_id' => $this->letter->id,
            'letter_number' => $this->letter->letter_number,
            'subject' => $this->letter->subject,
            'content' => $this->letter->rendered_html,
            'created_at' => $this->letter->created_at->toISOString(),
        ]));

        return $currentHash === $this->document_hash;
    }
}
