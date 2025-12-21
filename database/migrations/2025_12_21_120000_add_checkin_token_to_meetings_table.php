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
        Schema::table('meetings', function (Blueprint $table) {
            $table->string('checkin_token', 64)->nullable()->after('attendance_file');
            $table->timestamp('checkin_token_expires_at')->nullable()->after('checkin_token');
            $table->integer('checkin_token_duration')->default(5)->after('checkin_token_expires_at'); // durasi dalam menit
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropColumn(['checkin_token', 'checkin_token_expires_at', 'checkin_token_duration']);
        });
    }
};
