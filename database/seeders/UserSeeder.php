<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $role = \App\Models\Role::where('name', 'admin')->first();

        $user = \App\Models\User::firstOrCreate(
            [
                'name' => 'Admin',
                'nip' => '2023.01.02.03',
                'password' => bcrypt('12345678'),
                'role_id' => $role ? $role->id : null,
            ]
        );
    }
}
