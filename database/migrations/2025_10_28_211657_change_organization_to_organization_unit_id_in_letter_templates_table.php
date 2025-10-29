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
        Schema::table('letter_templates', function (Blueprint $table) {
            // Drop old organization column (string)
            $table->dropColumn('organization');
            
            // Add new organization_unit_id foreign key
            $table->foreignId('organization_unit_id')
                  ->nullable()
                  ->after('category')
                  ->constrained('organization_units')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('letter_templates', function (Blueprint $table) {
            // Drop foreign key and column
            $table->dropForeign(['organization_unit_id']);
            $table->dropColumn('organization_unit_id');
            
            // Restore old organization column
            $table->string('organization')->nullable()->after('category');
        });
    }
};
