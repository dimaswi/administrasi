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
        Schema::create('incoming_letters', function (Blueprint $table) {
            $table->id();
            
            // Numbering
            $table->string('incoming_number')->unique(); // SM/001/UNIT/X/2025
            $table->string('original_number'); // Nomor surat dari pengirim
            
            // Dates
            $table->date('original_date'); // Tanggal di surat asli
            $table->date('received_date'); // Tanggal diterima
            
            // Sender & Content
            $table->string('sender'); // Pengirim/Asal surat
            $table->text('subject'); // Perihal
            $table->string('category')->nullable(); // Undangan, Permohonan, Pemberitahuan, dll
            $table->enum('classification', ['biasa', 'penting', 'segera', 'rahasia'])->default('biasa'); // Sifat surat
            
            // Attachments
            $table->integer('attachment_count')->default(0);
            $table->text('attachment_description')->nullable();
            
            // File
            $table->string('file_path')->nullable(); // Scan/PDF surat
            
            // Organization & User
            $table->foreignId('organization_unit_id')->constrained('organization_units');
            $table->foreignId('registered_by')->constrained('users'); // Yang input surat masuk
            
            // Status
            $table->enum('status', ['new', 'disposed', 'in_progress', 'completed', 'archived'])->default('new');
            
            // Notes
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['status', 'received_date']);
            $table->index('organization_unit_id');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incoming_letters');
    }
};
