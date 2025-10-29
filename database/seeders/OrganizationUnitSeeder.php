<?php

namespace Database\Seeders;

use App\Models\OrganizationUnit;
use Illuminate\Database\Seeder;

class OrganizationUnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Level 1 - Top Level
        $direktorat = OrganizationUnit::create([
            'code' => 'DIR',
            'name' => 'Direktorat',
            'description' => 'Direktorat Utama',
            'parent_id' => null,
            'level' => 1,
            'is_active' => true,
        ]);

        // Level 2 - Divisions
        $sekretariat = OrganizationUnit::create([
            'code' => 'SEKR',
            'name' => 'Sekretariat',
            'description' => 'Sekretariat Direktorat',
            'parent_id' => $direktorat->id,
            'level' => 2,
            'is_active' => true,
        ]);

        $divisiSDM = OrganizationUnit::create([
            'code' => 'SDM',
            'name' => 'Divisi Sumber Daya Manusia',
            'description' => 'Divisi Manajemen SDM',
            'parent_id' => $direktorat->id,
            'level' => 2,
            'is_active' => true,
        ]);

        $divisiKeuangan = OrganizationUnit::create([
            'code' => 'KEU',
            'name' => 'Divisi Keuangan',
            'description' => 'Divisi Manajemen Keuangan',
            'parent_id' => $direktorat->id,
            'level' => 2,
            'is_active' => true,
        ]);

        $divisiIT = OrganizationUnit::create([
            'code' => 'IT',
            'name' => 'Divisi Teknologi Informasi',
            'description' => 'Divisi IT dan Sistem Informasi',
            'parent_id' => $direktorat->id,
            'level' => 2,
            'is_active' => true,
        ]);

        $divisiOperasional = OrganizationUnit::create([
            'code' => 'OPS',
            'name' => 'Divisi Operasional',
            'description' => 'Divisi Operasional dan Layanan',
            'parent_id' => $direktorat->id,
            'level' => 2,
            'is_active' => true,
        ]);

        // Level 3 - Sub Divisions / Departments
        OrganizationUnit::create([
            'code' => 'SEKR-TU',
            'name' => 'Sub Bagian Tata Usaha',
            'description' => 'Tata Usaha dan Administrasi Umum',
            'parent_id' => $sekretariat->id,
            'level' => 3,
            'is_active' => true,
        ]);

        OrganizationUnit::create([
            'code' => 'SEKR-HUMAS',
            'name' => 'Sub Bagian Hubungan Masyarakat',
            'description' => 'Hubungan Masyarakat dan Protokol',
            'parent_id' => $sekretariat->id,
            'level' => 3,
            'is_active' => true,
        ]);

        OrganizationUnit::create([
            'code' => 'SDM-REKRUT',
            'name' => 'Sub Bagian Rekrutmen',
            'description' => 'Rekrutmen dan Seleksi Pegawai',
            'parent_id' => $divisiSDM->id,
            'level' => 3,
            'is_active' => true,
        ]);

        OrganizationUnit::create([
            'code' => 'SDM-PENGEMBANGAN',
            'name' => 'Sub Bagian Pengembangan SDM',
            'description' => 'Pelatihan dan Pengembangan Pegawai',
            'parent_id' => $divisiSDM->id,
            'level' => 3,
            'is_active' => true,
        ]);

        OrganizationUnit::create([
            'code' => 'KEU-AKUNTANSI',
            'name' => 'Sub Bagian Akuntansi',
            'description' => 'Akuntansi dan Pembukuan',
            'parent_id' => $divisiKeuangan->id,
            'level' => 3,
            'is_active' => true,
        ]);

        OrganizationUnit::create([
            'code' => 'KEU-ANGGARAN',
            'name' => 'Sub Bagian Anggaran',
            'description' => 'Perencanaan dan Pengelolaan Anggaran',
            'parent_id' => $divisiKeuangan->id,
            'level' => 3,
            'is_active' => true,
        ]);

        OrganizationUnit::create([
            'code' => 'IT-INFRASTRUKTUR',
            'name' => 'Sub Bagian Infrastruktur',
            'description' => 'Infrastruktur dan Jaringan IT',
            'parent_id' => $divisiIT->id,
            'level' => 3,
            'is_active' => true,
        ]);

        OrganizationUnit::create([
            'code' => 'IT-APLIKASI',
            'name' => 'Sub Bagian Aplikasi',
            'description' => 'Pengembangan dan Pemeliharaan Aplikasi',
            'parent_id' => $divisiIT->id,
            'level' => 3,
            'is_active' => true,
        ]);

        OrganizationUnit::create([
            'code' => 'OPS-LAYANAN',
            'name' => 'Sub Bagian Layanan',
            'description' => 'Layanan Operasional Harian',
            'parent_id' => $divisiOperasional->id,
            'level' => 3,
            'is_active' => true,
        ]);

        OrganizationUnit::create([
            'code' => 'OPS-LOGISTIK',
            'name' => 'Sub Bagian Logistik',
            'description' => 'Pengelolaan Logistik dan Inventaris',
            'parent_id' => $divisiOperasional->id,
            'level' => 3,
            'is_active' => true,
        ]);

        $this->command->info('Organization Units seeded successfully!');
    }
}

