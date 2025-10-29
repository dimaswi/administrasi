<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rooms = [
            [
                'code' => 'R-101',
                'name' => 'Ruang Rapat Utama',
                'building' => 'Gedung A',
                'floor' => '1',
                'capacity' => 50,
                'facilities' => 'Projector, Sound System, AC, Whiteboard, Wifi',
                'description' => 'Ruang rapat utama untuk meeting besar',
                'is_active' => true,
            ],
            [
                'code' => 'R-102',
                'name' => 'Ruang Rapat Direksi',
                'building' => 'Gedung A',
                'floor' => '1',
                'capacity' => 20,
                'facilities' => 'TV, Video Conference, AC, Whiteboard, Wifi',
                'description' => 'Ruang rapat khusus direksi',
                'is_active' => true,
            ],
            [
                'code' => 'R-201',
                'name' => 'Ruang Rapat IT',
                'building' => 'Gedung A',
                'floor' => '2',
                'capacity' => 15,
                'facilities' => 'Projector, AC, Whiteboard, Wifi',
                'description' => 'Ruang rapat untuk divisi IT',
                'is_active' => true,
            ],
            [
                'code' => 'R-202',
                'name' => 'Ruang Rapat Keuangan',
                'building' => 'Gedung A',
                'floor' => '2',
                'capacity' => 15,
                'facilities' => 'Projector, AC, Whiteboard, Wifi',
                'description' => 'Ruang rapat untuk divisi keuangan',
                'is_active' => true,
            ],
            [
                'code' => 'R-301',
                'name' => 'Ruang Rapat SDM',
                'building' => 'Gedung A',
                'floor' => '3',
                'capacity' => 12,
                'facilities' => 'TV, AC, Whiteboard, Wifi',
                'description' => 'Ruang rapat untuk divisi SDM',
                'is_active' => true,
            ],
            [
                'code' => 'R-302',
                'name' => 'Ruang Meeting Room Small',
                'building' => 'Gedung A',
                'floor' => '3',
                'capacity' => 8,
                'facilities' => 'AC, Whiteboard, Wifi',
                'description' => 'Ruang rapat kecil untuk diskusi tim',
                'is_active' => true,
            ],
            [
                'code' => 'R-B01',
                'name' => 'Aula Serbaguna',
                'building' => 'Gedung B',
                'floor' => '1',
                'capacity' => 100,
                'facilities' => 'Stage, Sound System, Projector, AC, Wifi',
                'description' => 'Aula untuk acara besar dan seminar',
                'is_active' => true,
            ],
            [
                'code' => 'R-B02',
                'name' => 'Ruang Training',
                'building' => 'Gedung B',
                'floor' => '1',
                'capacity' => 30,
                'facilities' => 'Projector, AC, Whiteboard, Wifi, Komputer',
                'description' => 'Ruang untuk pelatihan dan workshop',
                'is_active' => true,
            ],
        ];

        foreach ($rooms as $room) {
            Room::create($room);
        }

        $this->command->info('Rooms seeded successfully!');
    }
}

