<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Change from unique code to composite unique (code + organization_unit_id)
     * This allows same code in different organization units (for linked templates)
     */
    public function up(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            // Drop the existing unique constraint on code
            $table->dropUnique(['code']);
            
            // Add composite unique constraint on code + organization_unit_id
            // This allows same code in different units, but unique within same unit
            $table->unique(['code', 'organization_unit_id'], 'document_templates_code_org_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            // Drop composite unique
            $table->dropUnique('document_templates_code_org_unique');
            
            // Restore original unique on code only
            $table->unique('code');
        });
    }
};
