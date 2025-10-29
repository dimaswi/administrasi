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
        Schema::create('meeting_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['participant', 'moderator', 'secretary', 'observer'])->default('participant'); // Peran dalam rapat
            $table->enum('attendance_status', ['invited', 'confirmed', 'attended', 'absent', 'excused'])->default('invited'); // Status kehadiran
            $table->time('check_in_time')->nullable(); // Waktu check-in
            $table->text('notes')->nullable(); // Catatan
            $table->timestamps();
            
            // Unique constraint untuk mencegah duplikasi peserta
            $table->unique(['meeting_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_participants');
    }
};
