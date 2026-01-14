<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('job_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique()->comment('Kode untuk NIK, contoh: 1 = Perawat');
            $table->string('name', 100)->comment('Nama kategori, contoh: Perawat, Dokter');
            $table->text('description')->nullable();
            $table->boolean('is_medical')->default(false)->comment('Apakah tenaga medis');
            $table->boolean('requires_str')->default(false)->comment('Wajib punya STR');
            $table->boolean('requires_sip')->default(false)->comment('Wajib punya SIP');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_categories');
    }
};
