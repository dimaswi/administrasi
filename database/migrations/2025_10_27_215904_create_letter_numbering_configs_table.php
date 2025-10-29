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
        Schema::create('letter_numbering_configs', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g., "SK", "ST"
            $table->string('name'); // e.g., "Surat Keputusan"
            $table->string('format'); // e.g., "XXX/SK/{{unit}}/{{month}}/{{year}}"
            $table->json('prefix_codes')->nullable(); // Array of unit codes
            $table->enum('counter_reset', ['never', 'yearly', 'monthly'])->default('yearly');
            $table->integer('last_number')->default(0);
            $table->integer('year')->nullable();
            $table->integer('month')->nullable();
            $table->integer('padding')->default(3); // Number padding (001, 002, etc.)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['code', 'is_active']);
            $table->index(['year', 'month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('letter_numbering_configs');
    }
};
