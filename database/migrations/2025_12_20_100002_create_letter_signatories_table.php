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
        Schema::create('letter_signatories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('letter_id')->constrained('outgoing_letters')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Reference to signature slot in template
            $table->string('slot_id');
            
            // Order of signing (for sequential approval)
            $table->integer('sign_order')->default(0);
            
            // Status
            $table->string('status')->default('pending');
            // pending, approved, rejected
            
            // Signature data
            $table->timestamp('signed_at')->nullable();
            $table->string('signature_image')->nullable(); // uploaded signature image
            $table->text('rejection_reason')->nullable();
            
            // Certificate data after signing
            $table->string('certificate_id')->nullable();
            $table->string('document_hash')->nullable();
            
            $table->timestamps();
            
            $table->unique(['letter_id', 'slot_id']);
            $table->index(['letter_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('letter_signatories');
    }
};
