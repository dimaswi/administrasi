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
        Schema::create('outgoing_letters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('document_templates')->onDelete('restrict');
            $table->foreignId('incoming_letter_id')->nullable()->constrained('incoming_letters')->onDelete('set null');
            
            $table->string('letter_number')->nullable();
            $table->string('subject');
            $table->date('letter_date');
            
            // Filled variable values from template
            $table->json('variable_values')->nullable();
            /*
            {
                "nomor_surat": "001/SK/2024",
                "perihal": "Undangan Rapat",
                "tujuan": "Kepala Sekolah SD...",
                "isi_surat": "Dengan hormat..."
            }
            */
            
            // Rendered HTML for preview (cached)
            $table->longText('rendered_html')->nullable();
            
            // Generated PDF path
            $table->string('pdf_path')->nullable();
            
            // Attachments
            $table->json('attachments')->nullable();
            
            // Status workflow
            $table->string('status')->default('draft');
            // draft, pending_approval, partially_signed, fully_signed, rejected
            
            $table->text('notes')->nullable();
            
            // Tracking
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['status', 'created_at']);
            $table->index('letter_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outgoing_letters');
    }
};
