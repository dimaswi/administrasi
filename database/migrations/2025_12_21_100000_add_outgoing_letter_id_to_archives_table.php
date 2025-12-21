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
        // First, drop the foreign key constraint on letter_id if it exists
        Schema::table('archives', function (Blueprint $table) {
            // Drop foreign key constraint
            $table->dropForeign(['letter_id']);
        });
        
        // Add outgoing_letter_id column
        Schema::table('archives', function (Blueprint $table) {
            $table->foreignId('outgoing_letter_id')->nullable()->after('letter_id')->constrained('outgoing_letters')->nullOnDelete();
        });
        
        // Drop the old letter_id column since 'letters' table doesn't exist
        Schema::table('archives', function (Blueprint $table) {
            $table->dropColumn('letter_id');
        });
        
        // Update the type enum to include 'outgoing_letter'
        DB::statement("ALTER TABLE archives DROP CONSTRAINT IF EXISTS archives_type_check");
        DB::statement("ALTER TABLE archives ADD CONSTRAINT archives_type_check CHECK (type IN ('letter', 'incoming_letter', 'outgoing_letter', 'document'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back letter_id column
        Schema::table('archives', function (Blueprint $table) {
            $table->unsignedBigInteger('letter_id')->nullable()->after('type');
        });
        
        // Drop outgoing_letter_id column
        Schema::table('archives', function (Blueprint $table) {
            $table->dropForeign(['outgoing_letter_id']);
            $table->dropColumn('outgoing_letter_id');
        });
        
        // Restore original enum constraint
        DB::statement("ALTER TABLE archives DROP CONSTRAINT IF EXISTS archives_type_check");
        DB::statement("ALTER TABLE archives ADD CONSTRAINT archives_type_check CHECK (type IN ('letter', 'incoming_letter', 'document'))");
    }
};
