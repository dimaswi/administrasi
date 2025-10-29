<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();

        if (!$user) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        $notifications = [
            [
                'user_id' => $user->id,
                'type' => 'meeting_invitation',
                'title' => 'Undangan Rapat Baru',
                'message' => 'Anda diundang ke rapat: Rapat Koordinasi Tim',
                'icon' => 'Calendar',
                'color' => 'blue',
                'action_url' => '/meeting/meetings/1',
                'is_read' => false,
                'created_at' => now()->subMinutes(5),
            ],
            [
                'user_id' => $user->id,
                'type' => 'action_item_assigned',
                'title' => 'Action Item Baru',
                'message' => 'Anda ditugaskan: Menyusun laporan hasil survei',
                'icon' => 'CheckCircle2',
                'color' => 'green',
                'action_url' => '/meeting/meetings/1',
                'is_read' => false,
                'created_at' => now()->subHours(2),
            ],
            [
                'user_id' => $user->id,
                'type' => 'meeting_starting',
                'title' => 'Rapat Akan Dimulai',
                'message' => 'Rapat "Evaluasi Kinerja Q4" akan dimulai dalam 30 menit',
                'icon' => 'Clock',
                'color' => 'yellow',
                'action_url' => '/meeting/meetings/2',
                'is_read' => false,
                'created_at' => now()->subMinutes(10),
            ],
            [
                'user_id' => $user->id,
                'type' => 'action_item_deadline',
                'title' => 'Deadline Action Item',
                'message' => 'Deadline 1 hari lagi: Persiapan presentasi',
                'icon' => 'AlertCircle',
                'color' => 'yellow',
                'action_url' => '/meeting/meetings/1',
                'is_read' => true,
                'read_at' => now()->subHours(1),
                'created_at' => now()->subHours(3),
            ],
            [
                'user_id' => $user->id,
                'type' => 'meeting_status_change',
                'title' => 'Status Rapat Berubah',
                'message' => 'Rapat "Kick-off Project Alpha" telah selesai',
                'icon' => 'FileText',
                'color' => 'green',
                'action_url' => '/meeting/meetings/3',
                'is_read' => true,
                'read_at' => now()->subMinutes(30),
                'created_at' => now()->subHours(1),
            ],
        ];

        foreach ($notifications as $notification) {
            Notification::create($notification);
        }

        $this->command->info('Sample notifications created successfully!');
    }
}

