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
        Schema::create('letter_certificates', function (Blueprint $table) {
            $table->id();
            $table->string('certificate_id')->unique(); // e.g., CERT-2025-00001
            $table->foreignId('letter_id')->constrained('letters')->onDelete('cascade');
            $table->string('document_hash'); // SHA-256 hash for verification
            $table->foreignId('signed_by')->constrained('users');
            $table->string('signer_name');
            $table->string('signer_position');
            $table->string('signer_nip')->nullable();
            $table->timestamp('signed_at');
            $table->string('signature_file')->nullable(); // TTD image path if uploaded
            $table->json('metadata')->nullable(); // IP, user agent, etc.
            $table->enum('status', ['valid', 'revoked'])->default('valid');
            $table->text('revoked_reason')->nullable();
            $table->foreignId('revoked_by')->nullable()->constrained('users');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            
            $table->index('certificate_id');
            $table->index(['letter_id', 'status']);
            $table->index('document_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('letter_certificates');
    }
};
