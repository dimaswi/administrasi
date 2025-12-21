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
        Schema::create('letter_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('letter_id')->constrained('outgoing_letters')->onDelete('cascade');
            $table->integer('version')->default(1);
            $table->string('type'); // 'initial', 'revision_request', 'revision_submitted'
            
            // Snapshot of letter content at this version
            $table->json('variable_values')->nullable();
            $table->longText('rendered_html')->nullable();
            $table->string('pdf_path')->nullable();
            
            // Revision details
            $table->text('revision_notes')->nullable(); // Notes/comments about this revision
            $table->text('requested_changes')->nullable(); // What changes were requested
            
            // Who made this revision/request
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
            
            $table->index(['letter_id', 'version']);
        });

        // Add revision-related columns to outgoing_letters
        Schema::table('outgoing_letters', function (Blueprint $table) {
            $table->integer('current_version')->default(1)->after('notes');
            $table->boolean('revision_requested')->default(false)->after('current_version');
            $table->text('revision_request_notes')->nullable()->after('revision_requested');
            $table->foreignId('revision_requested_by')->nullable()->after('revision_request_notes')
                ->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('outgoing_letters', function (Blueprint $table) {
            $table->dropForeign(['revision_requested_by']);
            $table->dropColumn(['current_version', 'revision_requested', 'revision_request_notes', 'revision_requested_by']);
        });
        
        Schema::dropIfExists('letter_revisions');
    }
};
