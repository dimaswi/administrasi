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
        // KPI Categories (Kategori KPI)
        Schema::create('kpi_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Kinerja Utama", "Kompetensi", "Perilaku"
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->integer('weight')->default(100); // Total weight for category
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // KPI Templates (Template KPI)
        Schema::create('kpi_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('kpi_categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->enum('measurement_type', ['numeric', 'percentage', 'rating', 'yes_no'])->default('numeric');
            $table->string('unit')->nullable(); // e.g., "pcs", "%", "hari"
            $table->decimal('target_min', 10, 2)->nullable();
            $table->decimal('target_max', 10, 2)->nullable();
            $table->integer('weight')->default(1); // Weight within category
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpi_templates');
        Schema::dropIfExists('kpi_categories');
    }
};
