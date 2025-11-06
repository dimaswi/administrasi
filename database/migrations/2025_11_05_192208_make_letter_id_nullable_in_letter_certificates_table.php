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
        Schema::table('letter_certificates', function (Blueprint $table) {
            // Drop the existing foreign key constraint
            $table->dropForeign(['letter_id']);
            
            // Make letter_id nullable
            $table->foreignId('letter_id')->nullable()->change();
            
            // Re-add the foreign key constraint
            $table->foreign('letter_id')->references('id')->on('letters')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('letter_certificates', function (Blueprint $table) {
            // Drop the foreign key
            $table->dropForeign(['letter_id']);
            
            // Make letter_id not nullable again
            $table->foreignId('letter_id')->nullable(false)->change();
            
            // Re-add the foreign key constraint
            $table->foreign('letter_id')->references('id')->on('letters')->onDelete('cascade');
        });
    }
};
