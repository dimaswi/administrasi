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
        Schema::create('archives', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['letter', 'document']); // letter (from system) or document (upload)
            $table->foreignId('letter_id')->nullable()->constrained('letters');
            $table->string('document_number')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->date('document_date');
            $table->string('document_type')->nullable(); // SK, Undangan, MoU, etc.
            $table->string('file_path'); // PDF or other document
            $table->string('file_type')->nullable(); // pdf, docx, etc.
            $table->integer('file_size')->nullable(); // in bytes
            $table->string('sender')->nullable(); // For incoming mail
            $table->string('recipient')->nullable(); // For outgoing mail
            $table->enum('classification', ['public', 'internal', 'confidential', 'secret'])->default('internal');
            $table->integer('retention_period')->nullable(); // in years
            $table->date('retention_until')->nullable();
            $table->json('tags')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('archived_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['type', 'category']);
            $table->index('document_date');
            $table->index('document_type');
            $table->fullText(['title', 'description', 'document_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('archives');
    }
};
