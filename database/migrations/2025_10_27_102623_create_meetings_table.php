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
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->string('meeting_number')->unique(); // Nomor rapat
            $table->string('title'); // Judul rapat
            $table->text('agenda'); // Agenda rapat
            $table->date('meeting_date'); // Tanggal rapat
            $table->time('start_time'); // Waktu mulai
            $table->time('end_time'); // Waktu selesai
            $table->foreignId('room_id')->constrained('rooms')->onDelete('cascade'); // Ruangan
            $table->foreignId('organizer_id')->constrained('users')->onDelete('cascade'); // Penyelenggara/pembuat rapat
            $table->foreignId('organization_unit_id')->nullable()->constrained('organization_units')->onDelete('set null'); // Unit penyelenggara
            $table->enum('status', ['draft', 'scheduled', 'ongoing', 'completed', 'cancelled'])->default('draft'); // Status rapat
            $table->text('notes')->nullable(); // Catatan tambahan
            $table->text('minutes_of_meeting')->nullable(); // Notulen/hasil rapat
            $table->string('invitation_file')->nullable(); // File undangan (path)
            $table->string('memo_file')->nullable(); // File memo hasil rapat (path)
            $table->string('attendance_file')->nullable(); // File daftar hadir (path)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};
