<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class MeetingPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Organization Unit Management
            ['name' => 'organization.view', 'display_name' => 'Lihat Unit Organisasi', 'description' => 'Dapat melihat daftar unit organisasi', 'module' => 'Organization Management'],
            ['name' => 'organization.create', 'display_name' => 'Tambah Unit Organisasi', 'description' => 'Dapat menambah unit organisasi baru', 'module' => 'Organization Management'],
            ['name' => 'organization.edit', 'display_name' => 'Edit Unit Organisasi', 'description' => 'Dapat mengedit unit organisasi', 'module' => 'Organization Management'],
            ['name' => 'organization.delete', 'display_name' => 'Hapus Unit Organisasi', 'description' => 'Dapat menghapus unit organisasi', 'module' => 'Organization Management'],
            
            // Room Management
            ['name' => 'room.view', 'display_name' => 'Lihat Ruangan', 'description' => 'Dapat melihat daftar ruangan', 'module' => 'Room Management'],
            ['name' => 'room.create', 'display_name' => 'Tambah Ruangan', 'description' => 'Dapat menambah ruangan baru', 'module' => 'Room Management'],
            ['name' => 'room.edit', 'display_name' => 'Edit Ruangan', 'description' => 'Dapat mengedit ruangan', 'module' => 'Room Management'],
            ['name' => 'room.delete', 'display_name' => 'Hapus Ruangan', 'description' => 'Dapat menghapus ruangan', 'module' => 'Room Management'],
            
            // Meeting Management
            ['name' => 'meeting.view', 'display_name' => 'Lihat Rapat', 'description' => 'Dapat melihat daftar rapat', 'module' => 'Meeting Management'],
            ['name' => 'meeting.create', 'display_name' => 'Buat Rapat', 'description' => 'Dapat membuat rapat baru', 'module' => 'Meeting Management'],
            ['name' => 'meeting.edit', 'display_name' => 'Edit Rapat', 'description' => 'Dapat mengedit rapat', 'module' => 'Meeting Management'],
            ['name' => 'meeting.delete', 'display_name' => 'Hapus Rapat', 'description' => 'Dapat menghapus rapat', 'module' => 'Meeting Management'],
            ['name' => 'meeting.manage-participants', 'display_name' => 'Kelola Peserta Rapat', 'description' => 'Dapat mengelola peserta rapat', 'module' => 'Meeting Management'],
            ['name' => 'meeting.generate-documents', 'display_name' => 'Generate Dokumen Rapat', 'description' => 'Dapat generate undangan, memo, dan daftar hadir', 'module' => 'Meeting Management'],
            ['name' => 'meeting.mark-attendance', 'display_name' => 'Tandai Kehadiran', 'description' => 'Dapat menandai kehadiran peserta', 'module' => 'Meeting Management'],
            ['name' => 'meeting.complete', 'display_name' => 'Selesaikan Rapat', 'description' => 'Dapat menyelesaikan rapat dan input notulen', 'module' => 'Meeting Management'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Update admin role to include all meeting permissions
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $allPermissions = Permission::all();
            $adminRole->permissions()->sync($allPermissions->pluck('id'));
        }

        $this->command->info('Meeting permissions seeded successfully!');
    }
}

