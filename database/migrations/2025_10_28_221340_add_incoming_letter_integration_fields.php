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
        // Add incoming_letter_id to letters table (surat keluar bisa jadi balasan dari surat masuk)
        Schema::table('letters', function (Blueprint $table) {
            $table->foreignId('incoming_letter_id')->nullable()->after('template_id')->constrained('incoming_letters')->onDelete('set null');
        });
        
        // Add incoming_letter_id to meetings table (meeting bisa dari undangan surat masuk)
        Schema::table('meetings', function (Blueprint $table) {
            $table->foreignId('incoming_letter_id')->nullable()->after('organization_unit_id')->constrained('incoming_letters')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('letters', function (Blueprint $table) {
            $table->dropForeign(['incoming_letter_id']);
            $table->dropColumn('incoming_letter_id');
        });
        
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropForeign(['incoming_letter_id']);
            $table->dropColumn('incoming_letter_id');
        });
    }
};
