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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Kode ruangan
            $table->string('name'); // Nama ruangan
            $table->string('building')->nullable(); // Gedung/lokasi
            $table->string('floor')->nullable(); // Lantai
            $table->integer('capacity')->default(0); // Kapasitas
            $table->text('facilities')->nullable(); // Fasilitas (JSON atau text)
            $table->text('description')->nullable(); // Deskripsi
            $table->boolean('is_active')->default(true); // Status aktif
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
