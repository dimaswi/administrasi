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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            
            // NIK: YYYY-KATEGORI-URUT (contoh: 2026-1-001)
            $table->string('employee_id', 20)->unique()->comment('Nomor Induk Pegawai');
            
            // Link to User (optional, for employees who have system access)
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            
            // Personal Information
            $table->string('first_name', 100);
            $table->string('last_name', 100)->nullable();
            $table->string('nik', 16)->unique()->nullable()->comment('NIK KTP');
            $table->enum('gender', ['male', 'female']);
            $table->string('place_of_birth', 100)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('religion', 50)->nullable();
            $table->string('marital_status', 20)->nullable()->comment('single, married, divorced, widowed');
            $table->string('blood_type', 5)->nullable();
            
            // Contact Information
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->string('postal_code', 10)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('phone_secondary', 20)->nullable();
            $table->string('email', 100)->nullable();
            
            // Emergency Contact
            $table->string('emergency_contact_name', 100)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->string('emergency_contact_relation', 50)->nullable();
            
            // Employment Information
            $table->foreignId('job_category_id')->constrained();
            $table->foreignId('employment_status_id')->constrained();
            $table->foreignId('organization_unit_id')->nullable()->constrained()->nullOnDelete();
            $table->string('position', 100)->nullable()->comment('Jabatan');
            $table->date('join_date');
            $table->date('contract_start_date')->nullable();
            $table->date('contract_end_date')->nullable();
            $table->date('permanent_date')->nullable()->comment('Tanggal diangkat tetap');
            $table->date('resign_date')->nullable();
            $table->string('resign_reason')->nullable();
            
            // Education
            $table->foreignId('education_level_id')->nullable()->constrained()->nullOnDelete();
            $table->string('education_institution', 200)->nullable();
            $table->string('education_major', 100)->nullable();
            $table->year('education_year')->nullable();
            
            // Documents
            $table->string('photo')->nullable();
            $table->string('ktp_file')->nullable();
            $table->string('npwp_number', 30)->nullable();
            $table->string('npwp_file')->nullable();
            $table->string('bpjs_kesehatan_number', 20)->nullable();
            $table->string('bpjs_ketenagakerjaan_number', 20)->nullable();
            
            // Bank Account
            $table->string('bank_name', 50)->nullable();
            $table->string('bank_account_number', 30)->nullable();
            $table->string('bank_account_name', 100)->nullable();
            
            // Status
            $table->enum('status', ['active', 'inactive', 'resigned', 'terminated'])->default('active');
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['status', 'job_category_id']);
            $table->index(['join_date']);
            $table->index(['organization_unit_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
