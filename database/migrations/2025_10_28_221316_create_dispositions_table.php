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
        Schema::create('dispositions', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->foreignId('incoming_letter_id')->constrained('incoming_letters')->onDelete('cascade');
            $table->foreignId('parent_disposition_id')->nullable()->constrained('dispositions')->onDelete('cascade'); // Multi-level disposisi
            
            // From & To
            $table->foreignId('from_user_id')->constrained('users');
            $table->foreignId('to_user_id')->constrained('users');
            
            // Disposition Details
            $table->string('instruction'); // Instruksi: untuk diketahui, ditindaklanjuti, dll
            $table->text('notes')->nullable(); // Catatan disposisi
            
            // Priority & Deadline
            $table->enum('priority', ['normal', 'high', 'urgent'])->default('normal');
            $table->date('deadline')->nullable();
            
            // Status Tracking
            $table->enum('status', ['pending', 'read', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['to_user_id', 'status']);
            $table->index(['incoming_letter_id', 'status']);
            $table->index('deadline');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dispositions');
    }
};
