<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    protected $fillable = [
        'code',
        'name',
        'building',
        'floor',
        'capacity',
        'facilities',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'capacity' => 'integer',
    ];

    /**
     * Meetings in this room
     */
    public function meetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'room_id');
    }

    /**
     * Check if room is available at specific date/time
     */
    public function isAvailable($date, $startTime, $endTime, $excludeMeetingId = null): bool
    {
        $query = $this->meetings()
            ->where('meeting_date', $date)
            ->whereIn('status', ['scheduled', 'ongoing'])
            ->where(function ($q) use ($startTime, $endTime) {
                $q->whereBetween('start_time', [$startTime, $endTime])
                  ->orWhereBetween('end_time', [$startTime, $endTime])
                  ->orWhere(function ($q2) use ($startTime, $endTime) {
                      $q2->where('start_time', '<=', $startTime)
                         ->where('end_time', '>=', $endTime);
                  });
            });

        if ($excludeMeetingId) {
            $query->where('id', '!=', $excludeMeetingId);
        }

        return $query->count() === 0;
    }

    /**
     * Get location string
     */
    public function getLocationAttribute(): string
    {
        $parts = array_filter([
            $this->building,
            $this->floor ? "Lantai {$this->floor}" : null,
        ]);
        
        return implode(', ', $parts) ?: '-';
    }
}
