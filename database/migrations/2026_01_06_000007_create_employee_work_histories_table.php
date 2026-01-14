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
        Schema::create('employee_work_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('company_name', 200);
            $table->string('position', 100);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->text('job_description')->nullable();
            $table->string('leaving_reason')->nullable();
            $table->string('reference_contact', 100)->nullable();
            $table->string('reference_phone', 20)->nullable();
            $table->timestamps();
            
            $table->index('employee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_work_histories');
    }
};
