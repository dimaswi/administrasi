<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FcmToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'token',
        'device_type',
        'device_name',
        'last_used_at',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Update or create FCM token for user
     */
    public static function updateOrCreateToken(int $userId, string $token, ?string $deviceType = null, ?string $deviceName = null): self
    {
        return static::updateOrCreate(
            ['user_id' => $userId, 'token' => $token],
            [
                'device_type' => $deviceType,
                'device_name' => $deviceName,
                'last_used_at' => now(),
            ]
        );
    }

    /**
     * Remove old or invalid tokens
     */
    public static function removeInvalidToken(string $token): void
    {
        static::where('token', $token)->delete();
    }
}
