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
        // Clear signatures karena sekarang TTD embedded di content
        // signature_layout tetap ada tapi tidak dipakai lagi
        DB::table('letter_templates')->update([
            'signatures' => json_encode([]),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback needed - signatures data already migrated to content
    }
};
