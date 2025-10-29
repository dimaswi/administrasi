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
        Schema::create('disposition_follow_ups', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->foreignId('disposition_id')->constrained('dispositions')->onDelete('cascade');
            
            // Follow Up Details
            $table->date('follow_up_date');
            $table->enum('follow_up_type', [
                'surat_balasan',      // Surat balasan dibuat
                'rapat',              // Rapat/pertemuan
                'kunjungan',          // Kunjungan
                'telepon',            // Telepon/email
                'tidak_perlu',        // Tidak perlu tindak lanjut
                'lainnya'             // Lainnya
            ]);
            $table->text('description'); // Deskripsi tindak lanjut
            
            // File attachment
            $table->string('file_path')->nullable();
            
            // Integration with other modules
            $table->foreignId('outgoing_letter_id')->nullable()->constrained('letters'); // Link ke surat keluar
            $table->foreignId('meeting_id')->nullable()->constrained('meetings'); // Link ke meeting
            
            // Status
            $table->enum('status', ['pending', 'completed'])->default('completed');
            
            // Creator
            $table->foreignId('created_by')->constrained('users');
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('disposition_id');
            $table->index('follow_up_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disposition_follow_ups');
    }
};
