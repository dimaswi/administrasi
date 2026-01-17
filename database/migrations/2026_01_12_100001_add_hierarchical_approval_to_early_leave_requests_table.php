<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('early_leave_requests', function (Blueprint $table) {
            // Delegation approval
            $table->foreignId('delegation_employee_id')->nullable()->after('delegation_to')->constrained('employees')->nullOnDelete();
            $table->timestamp('delegation_approved_at')->nullable()->after('delegation_employee_id');
            $table->text('delegation_notes')->nullable()->after('delegation_approved_at');
            
            // Supervisor approval (kepala unit)
            $table->foreignId('supervisor_id')->nullable()->after('delegation_notes')->constrained('users')->nullOnDelete();
            $table->timestamp('supervisor_approved_at')->nullable()->after('supervisor_id');
            $table->text('supervisor_notes')->nullable()->after('supervisor_approved_at');
            
            // Director signature (kepala level 1)
            $table->foreignId('director_id')->nullable()->after('supervisor_notes')->constrained('users')->nullOnDelete();
            $table->timestamp('director_signed_at')->nullable()->after('director_id');
            
            // Response letter tracking
            $table->string('response_letter_number')->nullable()->after('director_signed_at');
            $table->timestamp('response_letter_generated_at')->nullable()->after('response_letter_number');
            
            // Indexes
            $table->index('delegation_employee_id');
            $table->index('supervisor_id');
            $table->index('director_id');
        });

        // Update status enum - need to handle differently for PostgreSQL vs MySQL
        // Laravel's enum in PostgreSQL uses VARCHAR with CHECK constraint, not native ENUM type
        if (config('database.default') === 'pgsql') {
            // PostgreSQL: Drop check constraint and recreate with new values
            DB::statement("ALTER TABLE early_leave_requests DROP CONSTRAINT IF EXISTS early_leave_requests_status_check");
            
            // Change column to varchar temporarily to add check constraint
            DB::statement("ALTER TABLE early_leave_requests ALTER COLUMN status TYPE VARCHAR(50)");
            
            // Add new check constraint with all status values
            DB::statement("ALTER TABLE early_leave_requests ADD CONSTRAINT early_leave_requests_status_check CHECK (status::text = ANY (ARRAY['pending'::text, 'pending_delegation'::text, 'pending_supervisor'::text, 'pending_hr'::text, 'pending_director_sign'::text, 'approved'::text, 'rejected'::text]))");
        } else {
            // MySQL: Modify enum
            DB::statement("ALTER TABLE early_leave_requests MODIFY COLUMN status ENUM('pending', 'pending_delegation', 'pending_supervisor', 'pending_hr', 'pending_director_sign', 'approved', 'rejected') DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('early_leave_requests', function (Blueprint $table) {
            $table->dropForeign(['delegation_employee_id']);
            $table->dropForeign(['supervisor_id']);
            $table->dropForeign(['director_id']);
            
            $table->dropIndex(['delegation_employee_id']);
            $table->dropIndex(['supervisor_id']);
            $table->dropIndex(['director_id']);
            
            $table->dropColumn([
                'delegation_employee_id',
                'delegation_approved_at',
                'delegation_notes',
                'supervisor_id',
                'supervisor_approved_at',
                'supervisor_notes',
                'director_id',
                'director_signed_at',
                'response_letter_number',
                'response_letter_generated_at',
            ]);
        });
    }
};
