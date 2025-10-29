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
        Schema::create('organization_units', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Kode unit organisasi
            $table->string('name'); // Nama unit organisasi
            $table->text('description')->nullable(); // Deskripsi
            $table->foreignId('parent_id')->nullable()->constrained('organization_units')->onDelete('cascade'); // Parent untuk hierarki
            $table->integer('level')->default(1); // Level dalam hierarki (1=top, 2=sub, dst)
            $table->foreignId('head_id')->nullable()->constrained('users')->onDelete('set null'); // Kepala unit
            $table->boolean('is_active')->default(true); // Status aktif
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_units');
    }
};
