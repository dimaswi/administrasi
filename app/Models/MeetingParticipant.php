<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingParticipant extends Model
{
    protected $fillable = [
        'meeting_id',
        'user_id',
        'role',
        'attendance_status',
        'check_in_time',
        'notes',
    ];

    /**
     * Meeting
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * User participant
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark as attended
     */
    public function markAsAttended(): void
    {
        $this->update([
            'attendance_status' => 'attended',
            'check_in_time' => now()->format('H:i:s'),
        ]);
    }

    /**
     * Get role label
     */
    public function getRoleLabelAttribute(): string
    {
        return match($this->role) {
            'participant' => 'Peserta',
            'moderator' => 'Moderator',
            'secretary' => 'Notulis',
            'observer' => 'Pengamat',
            default => 'Unknown',
        };
    }

    /**
     * Get attendance status label
     */
    public function getAttendanceStatusLabelAttribute(): string
    {
        return match($this->attendance_status) {
            'invited' => 'Diundang',
            'confirmed' => 'Dikonfirmasi',
            'attended' => 'Hadir',
            'absent' => 'Tidak Hadir',
            'excused' => 'Berhalangan',
            default => 'Unknown',
        };
    }

    /**
     * Get attendance status color
     */
    public function getAttendanceStatusColorAttribute(): string
    {
        return match($this->attendance_status) {
            'invited' => 'gray',
            'confirmed' => 'blue',
            'attended' => 'green',
            'absent' => 'red',
            'excused' => 'yellow',
            default => 'gray',
        };
    }
}
