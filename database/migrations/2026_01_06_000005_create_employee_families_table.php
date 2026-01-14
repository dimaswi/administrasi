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
        Schema::create('employee_families', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('relation', 50)->comment('spouse, child, parent, sibling');
            $table->string('nik', 16)->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->string('place_of_birth', 100)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('occupation', 100)->nullable();
            $table->string('phone', 20)->nullable();
            $table->boolean('is_emergency_contact')->default(false);
            $table->boolean('is_dependent')->default(false)->comment('Tanggungan untuk BPJS/Asuransi');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['employee_id', 'relation']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_families');
    }
};
