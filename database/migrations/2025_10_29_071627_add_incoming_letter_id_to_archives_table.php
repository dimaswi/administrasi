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
        Schema::table('archives', function (Blueprint $table) {
            // Add incoming_letter_id column
            $table->foreignId('incoming_letter_id')->nullable()->after('letter_id')->constrained('incoming_letters');
        });
        
        // For PostgreSQL, we need to use raw SQL to modify the enum
        DB::statement("ALTER TABLE archives DROP CONSTRAINT IF EXISTS archives_type_check");
        DB::statement("ALTER TABLE archives ADD CONSTRAINT archives_type_check CHECK (type IN ('letter', 'incoming_letter', 'document'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('archives', function (Blueprint $table) {
            // Drop foreign key and column
            $table->dropForeign(['incoming_letter_id']);
            $table->dropColumn('incoming_letter_id');
        });
        
        // Restore original enum constraint
        DB::statement("ALTER TABLE archives DROP CONSTRAINT IF EXISTS archives_type_check");
        DB::statement("ALTER TABLE archives ADD CONSTRAINT archives_type_check CHECK (type IN ('letter', 'document'))");
    }
};
