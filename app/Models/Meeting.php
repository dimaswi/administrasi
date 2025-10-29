<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meeting extends Model
{
    protected $fillable = [
        'meeting_number',
        'title',
        'agenda',
        'meeting_date',
        'start_time',
        'end_time',
        'room_id',
        'organizer_id',
        'organization_unit_id',
        'incoming_letter_id',
        'status',
        'notes',
        'minutes_of_meeting',
        'memo_content',
        'invitation_file',
        'memo_file',
        'attendance_file',
    ];

    protected $casts = [
        'meeting_date' => 'date',
    ];

    /**
     * Room where meeting takes place
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Organizer of the meeting
     */
    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    /**
     * Organization unit that organizes the meeting
     */
    public function organizationUnit(): BelongsTo
    {
        return $this->belongsTo(OrganizationUnit::class);
    }

    /**
     * Incoming letter that triggered this meeting (if any)
     */
    public function incomingLetter(): BelongsTo
    {
        return $this->belongsTo(IncomingLetter::class, 'incoming_letter_id');
    }

    /**
     * Participants of the meeting
     */
    public function participants(): HasMany
    {
        return $this->hasMany(MeetingParticipant::class);
    }

    /**
     * Get participants by role
     */
    public function participantsByRole($role): HasMany
    {
        return $this->participants()->where('role', $role);
    }

    /**
     * Get moderators
     */
    public function moderators(): HasMany
    {
        return $this->participantsByRole('moderator');
    }

    /**
     * Get secretaries
     */
    public function secretaries(): HasMany
    {
        return $this->participantsByRole('secretary');
    }

    /**
     * Get observers
     */
    public function observers(): HasMany
    {
        return $this->participantsByRole('observer');
    }

    /**
     * Get regular participants
     */
    public function regularParticipants(): HasMany
    {
        return $this->participantsByRole('participant');
    }

    /**
     * Get attended participants
     */
    public function attendedParticipants(): HasMany
    {
        return $this->participants()->where('attendance_status', 'attended');
    }

    /**
     * Action items from the meeting
     */
    public function actionItems(): HasMany
    {
        return $this->hasMany(MeetingActionItem::class);
    }

    /**
     * Generate unique meeting number
     */
    public static function generateMeetingNumber(): string
    {
        $date = now()->format('Ymd');
        $count = static::whereDate('created_at', today())->count() + 1;
        return "MTG/{$date}/" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Check if meeting can be edited
     */
    public function canBeEdited(): bool
    {
        // Draft dan cancelled bisa diedit untuk dijadwalkan ulang
        return in_array($this->status, ['draft', 'cancelled']);
    }

    /**
     * Check if meeting can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['draft', 'scheduled', 'ongoing']);
    }

    /**
     * Check if meeting can be started (time has arrived)
     */
    public function canBeStarted(): bool
    {
        if (!in_array($this->status, ['draft', 'scheduled'])) {
            return false;
        }

        $now = now();
        
        // meeting_date sudah di-cast sebagai Carbon date, jadi ambil formatnya
        // Format date only (Y-m-d) lalu gabungkan dengan start_time
        $dateOnly = \Carbon\Carbon::parse($this->meeting_date)->format('Y-m-d');
        $meetingDateTime = \Carbon\Carbon::parse($dateOnly . ' ' . $this->start_time);
        
        // Bisa dimulai 30 menit sebelum waktu rapat
        $allowedStartTime = $meetingDateTime->copy()->subMinutes(30);
        
        return $now->greaterThanOrEqualTo($allowedStartTime);
    }

    /**
     * Get status badge color
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'draft' => 'gray',
            'scheduled' => 'blue',
            'ongoing' => 'yellow',
            'completed' => 'green',
            'cancelled' => 'red',
            default => 'gray',
        };
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'draft' => 'Draft',
            'scheduled' => 'Terjadwal',
            'ongoing' => 'Berlangsung',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
            default => 'Unknown',
        };
    }
}
