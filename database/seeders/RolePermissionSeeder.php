<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // User Management
            ['name' => 'user.view', 'display_name' => 'Lihat User', 'description' => 'Dapat melihat daftar user', 'module' => 'User Management'],
            ['name' => 'user.create', 'display_name' => 'Tambah User', 'description' => 'Dapat menambah user baru', 'module' => 'User Management'],
            ['name' => 'user.edit', 'display_name' => 'Edit User', 'description' => 'Dapat mengedit data user', 'module' => 'User Management'],
            ['name' => 'user.delete', 'display_name' => 'Hapus User', 'description' => 'Dapat menghapus user', 'module' => 'User Management'],
            
            // Role Management
            ['name' => 'role.view', 'display_name' => 'Lihat Role', 'description' => 'Dapat melihat daftar role', 'module' => 'Role Management'],
            ['name' => 'role.create', 'display_name' => 'Tambah Role', 'description' => 'Dapat menambah role baru', 'module' => 'Role Management'],
            ['name' => 'role.edit', 'display_name' => 'Edit Role', 'description' => 'Dapat mengedit role', 'module' => 'Role Management'],
            ['name' => 'role.delete', 'display_name' => 'Hapus Role', 'description' => 'Dapat menghapus role', 'module' => 'Role Management'],
            
            // Permission Management
            ['name' => 'permission.view', 'display_name' => 'Lihat Permission', 'description' => 'Dapat melihat daftar permission', 'module' => 'Permission Management'],
            ['name' => 'permission.create', 'display_name' => 'Tambah Permission', 'description' => 'Dapat menambah permission baru', 'module' => 'Permission Management'],
            ['name' => 'permission.edit', 'display_name' => 'Edit Permission', 'description' => 'Dapat mengedit permission', 'module' => 'Permission Management'],
            ['name' => 'permission.delete', 'display_name' => 'Hapus Permission', 'description' => 'Dapat menghapus permission', 'module' => 'Permission Management'],
            
            // HR Module Access
            ['name' => 'hr.access', 'display_name' => 'Akses Modul HR', 'description' => 'Dapat mengakses modul Human Resources', 'module' => 'HR'],

            // Dashboard
            ['name' => 'dashboard.view', 'display_name' => 'Lihat Dashboard', 'description' => 'Dapat mengakses dashboard', 'module' => 'Dashboard'],
            
            // Settings
            ['name' => 'settings.view', 'display_name' => 'Lihat Settings', 'description' => 'Dapat melihat pengaturan', 'module' => 'Settings'],
            ['name' => 'settings.edit', 'display_name' => 'Edit Settings', 'description' => 'Dapat mengedit pengaturan', 'module' => 'Settings'],
            
            // Incoming Letters (Surat Masuk)
            ['name' => 'incoming_letter.view', 'display_name' => 'Lihat Surat Masuk', 'description' => 'Dapat melihat daftar surat masuk', 'module' => 'Surat Masuk'],
            ['name' => 'incoming_letter.create', 'display_name' => 'Registrasi Surat Masuk', 'description' => 'Dapat meregistrasi surat masuk baru', 'module' => 'Surat Masuk'],
            ['name' => 'incoming_letter.edit', 'display_name' => 'Edit Surat Masuk', 'description' => 'Dapat mengedit data surat masuk', 'module' => 'Surat Masuk'],
            ['name' => 'incoming_letter.delete', 'display_name' => 'Hapus Surat Masuk', 'description' => 'Dapat menghapus surat masuk', 'module' => 'Surat Masuk'],
            
            // Dispositions
            ['name' => 'disposition.view', 'display_name' => 'Lihat Disposisi', 'description' => 'Dapat melihat disposisi', 'module' => 'Disposisi'],
            ['name' => 'disposition.create', 'display_name' => 'Buat Disposisi', 'description' => 'Dapat membuat disposisi baru', 'module' => 'Disposisi'],
            ['name' => 'disposition.edit', 'display_name' => 'Edit Disposisi', 'description' => 'Dapat mengedit disposisi', 'module' => 'Disposisi'],
            ['name' => 'disposition.delete', 'display_name' => 'Hapus Disposisi', 'description' => 'Dapat menghapus disposisi', 'module' => 'Disposisi'],
            ['name' => 'disposition.update_status', 'display_name' => 'Update Status Disposisi', 'description' => 'Dapat mengubah status disposisi (mulai kerjakan, selesaikan)', 'module' => 'Disposisi'],
            ['name' => 'disposition.add_follow_up', 'display_name' => 'Tambah Tindak Lanjut', 'description' => 'Dapat menambahkan tindak lanjut pada disposisi', 'module' => 'Disposisi'],
            ['name' => 'disposition.create_child', 'display_name' => 'Buat Sub-Disposisi', 'description' => 'Dapat membuat disposisi turunan/delegasi', 'module' => 'Disposisi'],
            
            // Document Templates (Template Surat)
            ['name' => 'document_template.view', 'display_name' => 'Lihat Template Surat', 'description' => 'Dapat melihat daftar template surat', 'module' => 'Template Surat'],
            ['name' => 'document_template.create', 'display_name' => 'Buat Template Surat', 'description' => 'Dapat membuat template surat baru', 'module' => 'Template Surat'],
            ['name' => 'document_template.edit', 'display_name' => 'Edit Template Surat', 'description' => 'Dapat mengedit template surat', 'module' => 'Template Surat'],
            ['name' => 'document_template.delete', 'display_name' => 'Hapus Template Surat', 'description' => 'Dapat menghapus template surat', 'module' => 'Template Surat'],
            
            // Outgoing Letters (Surat Keluar)
            ['name' => 'outgoing_letter.view', 'display_name' => 'Lihat Surat Keluar', 'description' => 'Dapat melihat daftar surat keluar', 'module' => 'Surat Keluar'],
            ['name' => 'outgoing_letter.create', 'display_name' => 'Buat Surat Keluar', 'description' => 'Dapat membuat surat keluar baru', 'module' => 'Surat Keluar'],
            ['name' => 'outgoing_letter.edit', 'display_name' => 'Edit Surat Keluar', 'description' => 'Dapat mengedit surat keluar', 'module' => 'Surat Keluar'],
            ['name' => 'outgoing_letter.delete', 'display_name' => 'Hapus Surat Keluar', 'description' => 'Dapat menghapus surat keluar', 'module' => 'Surat Keluar'],
            ['name' => 'outgoing_letter.submit', 'display_name' => 'Ajukan Surat Keluar', 'description' => 'Dapat mengajukan surat keluar untuk persetujuan', 'module' => 'Surat Keluar'],
            ['name' => 'outgoing_letter.sign', 'display_name' => 'Tanda Tangan Surat', 'description' => 'Dapat menandatangani/menyetujui surat keluar', 'module' => 'Surat Keluar'],
            
            // Archives
            ['name' => 'archive.view', 'display_name' => 'Lihat Arsip', 'description' => 'Dapat melihat daftar arsip', 'module' => 'Arsip'],
            ['name' => 'archive.create', 'display_name' => 'Tambah Arsip', 'description' => 'Dapat menambah arsip baru', 'module' => 'Arsip'],
            ['name' => 'archive.edit', 'display_name' => 'Edit Arsip', 'description' => 'Dapat mengedit data arsip', 'module' => 'Arsip'],
            ['name' => 'archive.delete', 'display_name' => 'Hapus Arsip', 'description' => 'Dapat menghapus arsip', 'module' => 'Arsip'],
            ['name' => 'archive.download', 'display_name' => 'Download Arsip', 'description' => 'Dapat mendownload file arsip', 'module' => 'Arsip'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            [
                'display_name' => 'Administrator',
                'description' => 'Administrator dengan akses penuh ke semua fitur sistem'
            ]
        );

        $userRole = Role::firstOrCreate(
            ['name' => 'user'],
            [
                'display_name' => 'User',
                'description' => 'User biasa dengan akses terbatas'
            ]
        );

        
        $allPermissions = Permission::all();
        $adminRole->permissions()->sync($allPermissions->pluck('id'));
        
        // User role hanya dapat akses dashboard dan meeting
        $userPermissions = Permission::whereIn('name', [
            'dashboard.view',
            'meeting.view',
            'meeting.create',
            'meeting.edit',
            'organization.view',
            'room.view',
        ])->pluck('id');
        $userRole->permissions()->sync($userPermissions);

    }
}
