<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\OrganizationUnit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buat admin user
        $adminRole = \App\Models\Role::where('name', 'admin')->first();
        
        User::firstOrCreate(
            ['nip' => '2023.01.02.03'],
            [
                'name' => 'Admin',
                'password' => bcrypt('12345678'),
                'role_id' => $adminRole ? $adminRole->id : 1,
                'organization_unit_id' => 1,
                'position' => 'Administrator',
                'phone' => '081234567890',
            ]
        );

        // Buat 100 user dengan role_id 2
        $organizations = OrganizationUnit::all();
        
        if ($organizations->isEmpty()) {
            $this->command->error('Tidak ada organization unit. Jalankan OrganizationUnitSeeder terlebih dahulu.');
            return;
        }

        $positions = [
            'Staff',
            'Kepala Seksi',
            'Kepala Sub Bagian',
            'Kepala Bagian',
            'Sekretaris',
            'Bendahara',
            'Analis',
            'Programmer',
            'Administrasi',
            'Operator',
        ];

        $firstNames = [
            'Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hendra', 'Indah', 'Joko',
            'Kartika', 'Lukman', 'Maya', 'Nanda', 'Oktavia', 'Putra', 'Qori', 'Rina', 'Sari', 'Tono',
            'Umar', 'Vina', 'Wati', 'Xena', 'Yudi', 'Zahra', 'Adi', 'Bella', 'Cahya', 'Dian',
            'Erlang', 'Fitri', 'Galuh', 'Hasan', 'Intan', 'Johan', 'Kiki', 'Lina', 'Mira', 'Novi',
            'Oka', 'Pandu', 'Qonita', 'Rahma', 'Sinta', 'Tia', 'Umi', 'Vero', 'Wawan', 'Yanto',
        ];

        $lastNames = [
            'Saputra', 'Pratama', 'Wibowo', 'Kurniawan', 'Santoso', 'Permana', 'Hidayat', 'Setiawan',
            'Nugroho', 'Utomo', 'Wijaya', 'Hermawan', 'Ramadan', 'Susanto', 'Hakim', 'Purnama',
            'Suryanto', 'Mahendra', 'Andika', 'Firmansyah', 'Adiputra', 'Kusuma', 'Laksono', 'Maulana',
            'Nirwana', 'Oktavian', 'Pradana', 'Qodri', 'Rahman', 'Sanjaya', 'Taufik', 'Umbara',
            'Valentino', 'Wardana', 'Xavier', 'Yulianto', 'Zakaria', 'Akbar', 'Bahri', 'Cahyono',
            'Darmawan', 'Effendi', 'Fauzi', 'Gunawan', 'Hadi', 'Ismail', 'Jamaludin', 'Kartono',
        ];

        $this->command->info('Membuat 100 user...');
        $bar = $this->command->getOutput()->createProgressBar(100);
        $bar->start();

        for ($i = 1; $i <= 100; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $name = $firstName . ' ' . $lastName;
            
            // Generate NIP: format YYYYMMDD + sequential number (3 digits)
            $nip = date('Ymd') . str_pad($i, 3, '0', STR_PAD_LEFT);
            
            // Random organization
            $organization = $organizations->random();
            
            // Random position
            $position = $positions[array_rand($positions)];
            
            // Random phone
            $phone = '08' . rand(1000000000, 9999999999);

            User::create([
                'name' => $name,
                'nip' => $nip,
                'password' => Hash::make('password'), // default password
                'role_id' => 2, // User role
                'organization_unit_id' => $organization->id,
                'position' => $position,
                'phone' => $phone,
            ]);

            $bar->advance();
        }

        $bar->finish();
        $this->command->newLine();
        $this->command->info('100 user berhasil dibuat dengan role_id 2 dan di-assign ke organization units!');
    }
}
