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
        Schema::create('letters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('letter_templates');
            $table->string('letter_number')->unique();
            $table->string('subject'); // Perihal
            $table->date('letter_date');
            $table->string('recipient')->nullable(); // Penerima
            $table->json('data'); // User-filled variable data
            $table->longText('rendered_html'); // Final rendered HTML
            $table->string('pdf_path')->nullable();
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'rejected', 'sent', 'archived'])->default('draft');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users');
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('letter_number');
            $table->index(['status', 'created_at']);
            $table->index('letter_date');
            $table->fullText(['subject', 'recipient']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('letters');
    }
};
