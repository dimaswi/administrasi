<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds 'leave_response' and 'early_leave_response' to template_type
     * for response letters (surat balasan cuti/pulang cepat)
     */
    public function up(): void
    {
        // Update template_type validation in controller is needed
        // The enum in database allows any string, so just add constants to model
        
        // For PostgreSQL, we might need to add new enum values
        if (config('database.default') === 'pgsql') {
            // Check if enum type exists and add new values
            DB::statement("DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_templates_template_type') THEN
                    -- No enum type, column is likely varchar
                    NULL;
                ELSE
                    -- Add new values to enum
                    ALTER TYPE document_templates_template_type ADD VALUE IF NOT EXISTS 'leave_response';
                    ALTER TYPE document_templates_template_type ADD VALUE IF NOT EXISTS 'early_leave_response';
                END IF;
            END $$;");
        }
        // MySQL with varchar doesn't need migration, just model update
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Enum values cannot be easily removed in PostgreSQL
        // For MySQL varchar, no action needed
    }
};
