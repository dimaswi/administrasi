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
        Schema::create('letter_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "SK Pengangkatan"
            $table->string('code')->unique(); // e.g., "SK", "ST", "SE"
            $table->string('category')->nullable(); // e.g., "Kepegawaian", "Umum"
            $table->text('description')->nullable();
            $table->json('content'); // TipTap JSON content
            $table->json('variables'); // Variable definitions with types
            $table->json('letterhead')->nullable(); // Letterhead configuration
            $table->string('numbering_format')->nullable(); // e.g., "XXX/{{code}}/{{unit}}/{{month}}/{{year}}"
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['code', 'is_active']);
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('letter_templates');
    }
};
