<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            // numbering_group_id: templates with same group share numbering sequence
            // If null, template uses its own ID as group (independent numbering)
            $table->unsignedBigInteger('numbering_group_id')->nullable()->after('organization_unit_id');
            
            // Index for faster lookup
            $table->index('numbering_group_id');
        });

        // Set existing templates to use their own ID as numbering_group_id
        DB::statement('UPDATE document_templates SET numbering_group_id = id WHERE numbering_group_id IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropIndex(['numbering_group_id']);
            $table->dropColumn('numbering_group_id');
        });
    }
};
