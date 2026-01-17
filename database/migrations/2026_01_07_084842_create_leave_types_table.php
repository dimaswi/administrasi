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
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            
            // Default quota per year
            $table->integer('default_quota')->default(0);
            
            // Is this type paid leave?
            $table->boolean('is_paid')->default(true);
            
            // Does this type require approval?
            $table->boolean('requires_approval')->default(true);
            
            // Can carry over unused quota to next year?
            $table->boolean('allow_carry_over')->default(false);
            $table->integer('max_carry_over_days')->default(0);
            
            // Minimum days advance notice required
            $table->integer('min_advance_days')->default(0);
            
            // Maximum consecutive days allowed
            $table->integer('max_consecutive_days')->nullable();
            
            // Is this available for all employees by default?
            $table->boolean('is_active')->default(true);
            
            // Display order
            $table->integer('sort_order')->default(0);
            
            // Color for UI display
            $table->string('color', 20)->default('blue');
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
