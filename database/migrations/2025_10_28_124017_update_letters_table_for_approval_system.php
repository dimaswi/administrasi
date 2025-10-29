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
        Schema::table('letters', function (Blueprint $table) {
            // Update status enum untuk menambahkan 'partially_signed' dan 'fully_signed'
            $table->dropColumn('status');
        });
        
        Schema::table('letters', function (Blueprint $table) {
            $table->enum('status', [
                'draft',
                'pending_approval',
                'partially_signed',
                'fully_signed',
                'approved',
                'rejected',
                'sent',
                'archived'
            ])->default('draft')->after('rendered_html');
            
            // Tambah kolom untuk updated_by
            $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('letters', function (Blueprint $table) {
            $table->dropColumn(['status', 'updated_by']);
        });
        
        Schema::table('letters', function (Blueprint $table) {
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'rejected', 'sent', 'archived'])->default('draft');
        });
    }
};
