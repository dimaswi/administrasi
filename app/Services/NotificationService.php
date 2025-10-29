<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

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
