<?php

namespace Database\Seeders;

use App\Models\HR\JobCategory;
use App\Models\HR\EmploymentStatus;
use App\Models\HR\EducationLevel;
use Illuminate\Database\Seeder;

class HRMasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Job Categories for Clinic
        $jobCategories = [
            ['code' => '1', 'name' => 'Dokter Umum', 'is_medical' => true, 'requires_str' => true, 'requires_sip' => true],
            ['code' => '2', 'name' => 'Dokter Spesialis', 'is_medical' => true, 'requires_str' => true, 'requires_sip' => true],
            ['code' => '3', 'name' => 'Perawat', 'is_medical' => true, 'requires_str' => true, 'requires_sip' => true],
            ['code' => '4', 'name' => 'Bidan', 'is_medical' => true, 'requires_str' => true, 'requires_sip' => true],
            ['code' => '5', 'name' => 'Apoteker', 'is_medical' => true, 'requires_str' => true, 'requires_sip' => true],
            ['code' => '6', 'name' => 'Asisten Apoteker', 'is_medical' => true, 'requires_str' => true, 'requires_sip' => false],
            ['code' => '7', 'name' => 'Analis Kesehatan', 'is_medical' => true, 'requires_str' => true, 'requires_sip' => true],
            ['code' => '8', 'name' => 'Radiografer', 'is_medical' => true, 'requires_str' => true, 'requires_sip' => true],
            ['code' => '9', 'name' => 'Rekam Medis', 'is_medical' => false, 'requires_str' => false, 'requires_sip' => false],
            ['code' => '10', 'name' => 'Administrasi', 'is_medical' => false, 'requires_str' => false, 'requires_sip' => false],
            ['code' => '11', 'name' => 'Keuangan', 'is_medical' => false, 'requires_str' => false, 'requires_sip' => false],
            ['code' => '12', 'name' => 'IT', 'is_medical' => false, 'requires_str' => false, 'requires_sip' => false],
            ['code' => '13', 'name' => 'Security', 'is_medical' => false, 'requires_str' => false, 'requires_sip' => false],
            ['code' => '14', 'name' => 'Cleaning Service', 'is_medical' => false, 'requires_str' => false, 'requires_sip' => false],
            ['code' => '15', 'name' => 'Driver', 'is_medical' => false, 'requires_str' => false, 'requires_sip' => false],
        ];

        foreach ($jobCategories as $category) {
            JobCategory::firstOrCreate(
                ['code' => $category['code']],
                $category
            );
        }

        // Employment Statuses
        $employmentStatuses = [
            ['code' => 'TETAP', 'name' => 'Karyawan Tetap', 'is_permanent' => true],
            ['code' => 'KONTRAK', 'name' => 'Karyawan Kontrak', 'is_permanent' => false],
            ['code' => 'PROBATION', 'name' => 'Masa Percobaan', 'is_permanent' => false],
            ['code' => 'PARTTIME', 'name' => 'Part Time', 'is_permanent' => false],
            ['code' => 'OUTSOURCE', 'name' => 'Outsource', 'is_permanent' => false],
            ['code' => 'MAGANG', 'name' => 'Magang/Internship', 'is_permanent' => false],
            ['code' => 'DOKTERTAMU', 'name' => 'Dokter Tamu', 'is_permanent' => false],
        ];

        foreach ($employmentStatuses as $status) {
            EmploymentStatus::firstOrCreate(
                ['code' => $status['code']],
                $status
            );
        }

        // Education Levels
        $educationLevels = [
            ['code' => 'SD', 'name' => 'Sekolah Dasar (SD)', 'level' => 1],
            ['code' => 'SMP', 'name' => 'Sekolah Menengah Pertama (SMP)', 'level' => 2],
            ['code' => 'SMA', 'name' => 'Sekolah Menengah Atas (SMA/SMK)', 'level' => 3],
            ['code' => 'D1', 'name' => 'Diploma 1 (D1)', 'level' => 4],
            ['code' => 'D2', 'name' => 'Diploma 2 (D2)', 'level' => 5],
            ['code' => 'D3', 'name' => 'Diploma 3 (D3)', 'level' => 6],
            ['code' => 'D4', 'name' => 'Diploma 4 (D4)', 'level' => 7],
            ['code' => 'S1', 'name' => 'Sarjana (S1)', 'level' => 8],
            ['code' => 'PROFESI', 'name' => 'Profesi', 'level' => 9],
            ['code' => 'S2', 'name' => 'Magister (S2)', 'level' => 10],
            ['code' => 'SP', 'name' => 'Spesialis', 'level' => 11],
            ['code' => 'S3', 'name' => 'Doktor (S3)', 'level' => 12],
        ];

        foreach ($educationLevels as $level) {
            EducationLevel::firstOrCreate(
                ['code' => $level['code']],
                $level
            );
        }
    }
}
