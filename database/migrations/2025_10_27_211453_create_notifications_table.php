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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // meeting_invitation, action_item_assigned, meeting_starting, action_item_deadline, etc
            $table->string('title');
            $table->text('message');
            $table->string('icon')->nullable(); // lucide icon name
            $table->string('color')->default('blue'); // blue, green, red, yellow, purple
            $table->json('data')->nullable(); // additional data like meeting_id, action_item_id, etc
            $table->string('action_url')->nullable(); // URL to navigate when clicked
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'is_read']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
