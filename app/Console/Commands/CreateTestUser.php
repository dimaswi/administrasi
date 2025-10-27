<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateTestUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create-test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create test users for permission testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $adminRole = Role::where('name', 'admin')->first();
        $userRole = Role::where('name', 'user')->first();

        if (!$adminRole || !$userRole) {
            $this->error('Roles not found. Please run the seeder first.');
            return;
        }

        // Create admin user
        $admin = User::updateOrCreate(
            ['nip' => 'admin'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
            ]
        );

        // Create regular user
        $user = User::updateOrCreate(
            ['nip' => 'user'],
            [
                'name' => 'Regular User',
                'password' => Hash::make('password'),
                'role_id' => $userRole->id,
            ]
        );

        $this->info('Test users created successfully:');
        $this->line('Admin - NIP: admin, Password: password');
        $this->line('User - NIP: user, Password: password');
    }
}
