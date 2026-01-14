<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        $defaults = [
            'company_name' => 'PT. Nama Perusahaan',
            'company_short_name' => '',
            'company_address' => '',
            'company_phone' => '',
            'company_email' => '',
            'company_website' => '',
            'company_npwp' => '',
            'office_latitude' => '-6.2088',
            'office_longitude' => '106.8456',
            'office_radius' => '100',
            'work_start_time' => '08:00',
            'work_end_time' => '17:00',
            'late_tolerance_minutes' => '15',
            'leave_approval_levels' => '1',
            'overtime_approval_required' => '1',
        ];

        foreach ($defaults as $key => $value) {
            \DB::table('settings')->insert([
                'key' => $key,
                'value' => $value,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
