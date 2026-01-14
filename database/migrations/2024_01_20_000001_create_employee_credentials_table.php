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
        Schema::create('employee_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // npwp, bpjs_kesehatan, bpjs_ketenagakerjaan, sim, ktp, passport, bank_account, etc
            $table->string('name'); // Label untuk kredensial (contoh: "SIM A", "Bank BCA")
            $table->string('number'); // Nomor kredensial
            $table->string('issued_by')->nullable(); // Diterbitkan oleh (kantor pajak, cabang bank, dll)
            $table->date('issued_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('document_path')->nullable(); // Path file dokumen
            $table->text('notes')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->foreignId('verified_by')->nullable()->constrained('users');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            
            $table->index(['employee_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_credentials');
    }
};
