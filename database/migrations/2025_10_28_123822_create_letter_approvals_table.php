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
        Schema::create('letter_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('letter_id')->constrained('letters')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict'); // User yang harus approve
            $table->integer('signature_index'); // Urutan di template.signatures (0,1,2,3)
            $table->string('position_name'); // Nama jabatan dari template
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('notes')->nullable(); // Catatan/alasan approve/reject
            $table->timestamp('signed_at')->nullable(); // Waktu approve/reject
            $table->text('signature_data')->nullable(); // QR code hash/certificate data
            $table->integer('order')->default(0); // Urutan approval (0 = parallel, >0 = sequential)
            $table->timestamps();
            
            // Indexes
            $table->index(['letter_id', 'user_id']);
            $table->index('status');
            $table->unique(['letter_id', 'signature_index']); // Satu signature index per letter
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('letter_approvals');
    }
};
