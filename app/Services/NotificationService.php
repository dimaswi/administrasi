<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\OutgoingLetter;
use App\Models\LetterSignatory;
use App\Models\DocumentTemplate;

class NotificationService
{
    /**
     * Create a notification for a user
     */
    public static function create(
        User $user,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        ?array $data = null,
        string $icon = 'Bell',
        string $color = 'blue'
    ): Notification {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'icon' => $icon,
            'color' => $color,
            'data' => $data,
            'action_url' => $actionUrl,
        ]);
    }

    // =====================================================
    // OUTGOING LETTER NOTIFICATIONS
    // =====================================================

    /**
     * Notify signatories about new letter assignment
     * Sent to: All signatories
     */
    public static function notifyLetterCreated(OutgoingLetter $letter): void
    {
        $letter->load(['signatories.user', 'creator']);
        
        foreach ($letter->signatories as $signatory) {
            if ($signatory->user && $signatory->user->id !== $letter->created_by) {
                self::create(
                    user: $signatory->user,
                    type: 'letter_assigned',
                    title: 'Ditunjuk Sebagai Penanda Tangan',
                    message: "Anda ditunjuk menandatangani surat: {$letter->subject}",
                    actionUrl: "/arsip/outgoing-letters/{$letter->id}",
                    data: [
                        'letter_id' => $letter->id,
                        'letter_number' => $letter->letter_number,
                    ],
                    icon: 'FileSignature',
                    color: 'blue'
                );
            }
        }

        // Notify first signatory that it's their turn
        self::notifyNextSignatory($letter);
    }

    /**
     * Notify the next signatory that it's their turn to sign
     * Sent to: Next signatory in queue
     */
    public static function notifyNextSignatory(OutgoingLetter $letter): void
    {
        $letter->load(['signatories.user']);
        
        // Find next pending signatory (lowest sign_order with pending status)
        $nextSignatory = $letter->signatories
            ->where('status', 'pending')
            ->sortBy('sign_order')
            ->first();

        if ($nextSignatory && $nextSignatory->user) {
            // Check if all previous signatories have signed
            $pendingBefore = $letter->signatories
                ->where('sign_order', '<', $nextSignatory->sign_order)
                ->where('status', 'pending')
                ->count();

            if ($pendingBefore === 0) {
                self::create(
                    user: $nextSignatory->user,
                    type: 'letter_ready_to_sign',
                    title: 'Giliran Anda Menandatangani',
                    message: "Surat \"{$letter->subject}\" siap untuk Anda tandatangani",
                    actionUrl: "/arsip/outgoing-letters/{$letter->id}",
                    data: [
                        'letter_id' => $letter->id,
                        'letter_number' => $letter->letter_number,
                    ],
                    icon: 'PenTool',
                    color: 'yellow'
                );
            }
        }
    }

    /**
     * Notify about letter being signed
     * Sent to: Creator + Next signatory
     */
    public static function notifyLetterSigned(OutgoingLetter $letter, User $signedBy): void
    {
        $letter->load(['creator', 'signatories.user']);
        
        // Notify creator
        if ($letter->creator && $letter->creator->id !== $signedBy->id) {
            $progress = $letter->getApprovalProgress();
            self::create(
                user: $letter->creator,
                type: 'letter_signed',
                title: 'Surat Ditandatangani',
                message: "{$signedBy->name} telah menandatangani surat: {$letter->subject} ({$progress['signed']}/{$progress['total']})",
                actionUrl: "/arsip/outgoing-letters/{$letter->id}",
                data: [
                    'letter_id' => $letter->id,
                    'signed_by' => $signedBy->id,
                    'progress' => $progress,
                ],
                icon: 'CheckCircle',
                color: 'green'
            );
        }

        // Notify next signatory if exists
        self::notifyNextSignatory($letter);
    }

    /**
     * Notify about letter fully signed
     * Sent to: Creator
     */
    public static function notifyLetterFullySigned(OutgoingLetter $letter): void
    {
        $letter->load('creator');
        
        if ($letter->creator) {
            self::create(
                user: $letter->creator,
                type: 'letter_completed',
                title: 'Surat Selesai Ditandatangani',
                message: "Surat {$letter->letter_number} \"{$letter->subject}\" telah selesai ditandatangani semua pihak",
                actionUrl: "/arsip/outgoing-letters/{$letter->id}",
                data: [
                    'letter_id' => $letter->id,
                    'letter_number' => $letter->letter_number,
                ],
                icon: 'CheckCircle2',
                color: 'green'
            );
        }
    }

    /**
     * Notify about letter rejection
     * Sent to: Creator
     */
    public static function notifyLetterRejected(OutgoingLetter $letter, User $rejectedBy, string $reason): void
    {
        $letter->load('creator');
        
        if ($letter->creator && $letter->creator->id !== $rejectedBy->id) {
            self::create(
                user: $letter->creator,
                type: 'letter_rejected',
                title: 'Surat Ditolak',
                message: "{$rejectedBy->name} menolak surat: {$letter->subject}. Alasan: {$reason}",
                actionUrl: "/arsip/outgoing-letters/{$letter->id}",
                data: [
                    'letter_id' => $letter->id,
                    'rejected_by' => $rejectedBy->id,
                    'reason' => $reason,
                ],
                icon: 'XCircle',
                color: 'red'
            );
        }
    }

    /**
     * Notify about revision request
     * Sent to: Creator
     */
    public static function notifyRevisionRequested(OutgoingLetter $letter, User $requestedBy, string $notes): void
    {
        $letter->load('creator');
        
        if ($letter->creator && $letter->creator->id !== $requestedBy->id) {
            self::create(
                user: $letter->creator,
                type: 'letter_revision_requested',
                title: 'Permintaan Revisi Surat',
                message: "{$requestedBy->name} meminta revisi surat: {$letter->subject}",
                actionUrl: "/arsip/outgoing-letters/{$letter->id}",
                data: [
                    'letter_id' => $letter->id,
                    'requested_by' => $requestedBy->id,
                    'notes' => $notes,
                ],
                icon: 'Edit',
                color: 'orange'
            );
        }
    }

    /**
     * Notify about revision submitted
     * Sent to: All signatories
     */
    public static function notifyRevisionSubmitted(OutgoingLetter $letter): void
    {
        $letter->load(['signatories.user', 'creator']);
        
        foreach ($letter->signatories as $signatory) {
            if ($signatory->user && $signatory->user->id !== $letter->created_by) {
                self::create(
                    user: $signatory->user,
                    type: 'letter_revised',
                    title: 'Surat Telah Direvisi',
                    message: "Surat \"{$letter->subject}\" telah direvisi dan siap ditandatangani kembali",
                    actionUrl: "/arsip/outgoing-letters/{$letter->id}",
                    data: [
                        'letter_id' => $letter->id,
                        'version' => $letter->current_version,
                    ],
                    icon: 'RefreshCw',
                    color: 'blue'
                );
            }
        }

        // Notify first signatory
        self::notifyNextSignatory($letter);
    }

    // =====================================================
    // DOCUMENT TEMPLATE NOTIFICATIONS
    // =====================================================

    /**
     * Notify about template duplication
     * Sent to: Original template creator
     */
    public static function notifyTemplateDuplicated(DocumentTemplate $original, DocumentTemplate $duplicate, User $duplicatedBy): void
    {
        // Get original template creator
        if ($original->created_by && $original->created_by !== $duplicatedBy->id) {
            $originalCreator = User::find($original->created_by);
            
            if ($originalCreator) {
                self::create(
                    user: $originalCreator,
                    type: 'template_duplicated',
                    title: 'Template Diduplikasi',
                    message: "{$duplicatedBy->name} menduplikasi template \"{$original->name}\"",
                    actionUrl: "/arsip/document-templates/{$duplicate->id}",
                    data: [
                        'original_id' => $original->id,
                        'duplicate_id' => $duplicate->id,
                        'duplicated_by' => $duplicatedBy->id,
                    ],
                    icon: 'Copy',
                    color: 'blue'
                );
            }
        }
    }

    // =====================================================
    // MEETING NOTIFICATIONS (existing)
    // =====================================================

    /**
     * Notify user about new meeting invitation
     */
    public static function notifyMeetingInvitation(User $user, $meeting): void
    {
        self::create(
            user: $user,
            type: 'meeting_invitation',
            title: 'Undangan Rapat Baru',
            message: "Anda diundang ke rapat: {$meeting->title}",
            actionUrl: "/meeting/meetings/{$meeting->id}",
            data: ['meeting_id' => $meeting->id],
            icon: 'Calendar',
            color: 'blue'
        );
    }

    /**
     * Notify user about meeting starting soon
     */
    public static function notifyMeetingStarting(User $user, $meeting, int $minutesBefore): void
    {
        self::create(
            user: $user,
            type: 'meeting_starting',
            title: 'Rapat Akan Dimulai',
            message: "Rapat \"{$meeting->title}\" akan dimulai dalam {$minutesBefore} menit",
            actionUrl: "/meeting/meetings/{$meeting->id}",
            data: ['meeting_id' => $meeting->id, 'minutes_before' => $minutesBefore],
            icon: 'Clock',
            color: 'yellow'
        );
    }

    /**
     * Notify user about action item assignment
     */
    public static function notifyActionItemAssigned(User $user, $actionItem, $meeting): void
    {
        self::create(
            user: $user,
            type: 'action_item_assigned',
            title: 'Action Item Baru',
            message: "Anda ditugaskan: {$actionItem->title}",
            actionUrl: "/meeting/meetings/{$meeting->id}",
            data: [
                'action_item_id' => $actionItem->id,
                'meeting_id' => $meeting->id
            ],
            icon: 'CheckCircle2',
            color: 'green'
        );
    }

    /**
     * Notify user about action item deadline approaching
     */
    public static function notifyActionItemDeadline(User $user, $actionItem, $meeting, int $daysLeft): void
    {
        $color = $daysLeft <= 1 ? 'red' : 'yellow';
        $message = $daysLeft === 0 
            ? "Deadline hari ini: {$actionItem->title}" 
            : "Deadline {$daysLeft} hari lagi: {$actionItem->title}";

        self::create(
            user: $user,
            type: 'action_item_deadline',
            title: 'Deadline Action Item',
            message: $message,
            actionUrl: "/meeting/meetings/{$meeting->id}",
            data: [
                'action_item_id' => $actionItem->id,
                'meeting_id' => $meeting->id,
                'days_left' => $daysLeft
            ],
            icon: 'AlertCircle',
            color: $color
        );
    }

    /**
     * Notify user about meeting status change
     */
    public static function notifyMeetingStatusChange(User $user, $meeting, string $newStatus): void
    {
        $statusLabels = [
            'scheduled' => 'dijadwalkan',
            'ongoing' => 'dimulai',
            'completed' => 'selesai',
            'cancelled' => 'dibatalkan',
        ];

        $colors = [
            'scheduled' => 'blue',
            'ongoing' => 'yellow',
            'completed' => 'green',
            'cancelled' => 'red',
        ];

        self::create(
            user: $user,
            type: 'meeting_status_change',
            title: 'Status Rapat Berubah',
            message: "Rapat \"{$meeting->title}\" telah {$statusLabels[$newStatus]}",
            actionUrl: "/meeting/meetings/{$meeting->id}",
            data: [
                'meeting_id' => $meeting->id,
                'new_status' => $newStatus
            ],
            icon: 'FileText',
            color: $colors[$newStatus] ?? 'blue'
        );
    }

    /**
     * Notify user about action item completion
     */
    public static function notifyActionItemCompleted(User $user, $actionItem, $meeting, User $completedBy): void
    {
        self::create(
            user: $user,
            type: 'action_item_completed',
            title: 'Action Item Diselesaikan',
            message: "{$completedBy->name} menyelesaikan: {$actionItem->title}",
            actionUrl: "/meeting/meetings/{$meeting->id}",
            data: [
                'action_item_id' => $actionItem->id,
                'meeting_id' => $meeting->id,
                'completed_by' => $completedBy->id
            ],
            icon: 'CheckCircle2',
            color: 'green'
        );
    }

    /**
     * Notify moderators about new action item
     */
    public static function notifyModeratorsNewActionItem(User $createdBy, $actionItem, $meeting): void
    {
        $moderators = $meeting->participants()
            ->where('role', 'moderator')
            ->with('user')
            ->get()
            ->pluck('user')
            ->filter(fn($user) => $user && $user->id !== $createdBy->id);

        foreach ($moderators as $moderator) {
            self::create(
                user: $moderator,
                type: 'action_item_created',
                title: 'Action Item Baru Ditambahkan',
                message: "{$createdBy->name} menambahkan action item: {$actionItem->title}",
                actionUrl: "/meeting/meetings/{$meeting->id}",
                data: [
                    'action_item_id' => $actionItem->id,
                    'meeting_id' => $meeting->id,
                    'created_by' => $createdBy->id
                ],
                icon: 'FileText',
                color: 'blue'
            );
        }
    }
}
