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
        Schema::create('employee_educations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('education_level_id')->constrained();
            $table->string('institution', 200);
            $table->string('major', 100)->nullable()->comment('Jurusan');
            $table->year('start_year')->nullable();
            $table->year('end_year')->nullable();
            $table->decimal('gpa', 3, 2)->nullable()->comment('IPK');
            $table->string('certificate_number', 100)->nullable();
            $table->string('certificate_file')->nullable();
            $table->boolean('is_highest')->default(false)->comment('Pendidikan tertinggi');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['employee_id', 'is_highest']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_educations');
    }
};
