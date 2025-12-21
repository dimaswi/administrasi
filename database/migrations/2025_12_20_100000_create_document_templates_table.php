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
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('category')->nullable();
            $table->foreignId('organization_unit_id')->constrained()->onDelete('cascade');
            $table->text('description')->nullable();
            
            // Page Settings
            $table->json('page_settings');
            /*
            {
                paper_size: "A4" | "Letter" | "Legal" | "F4",
                orientation: "portrait" | "landscape",
                margins: { top: 20, bottom: 20, left: 25, right: 20 }, // mm
                default_font: {
                    family: "Times New Roman",
                    size: 12, // pt
                    line_height: 1.5
                }
            }
            */
            
            // Header/Letterhead Settings
            $table->json('header_settings')->nullable();
            /*
            {
                enabled: true,
                height: 35, // mm
                margin_bottom: 10, // mm
                logo: {
                    enabled: true,
                    position: "left" | "center" | "right",
                    width: 20, // mm
                    height: 20, // mm (auto if null)
                    src: "/storage/..."
                },
                text_lines: [
                    { 
                        content: "PEMERINTAH KABUPATEN",
                        font_family: "Arial",
                        font_size: 14,
                        font_weight: "bold",
                        font_style: "normal",
                        text_align: "center",
                        letter_spacing: 0,
                        margin_bottom: 2
                    }
                ],
                border_bottom: {
                    enabled: true,
                    style: "double", // single, double, none
                    width: 2,
                    color: "#000000"
                }
            }
            */
            
            // Content Blocks
            $table->json('content_blocks');
            /*
            [
                {
                    id: "uuid",
                    type: "text" | "paragraph" | "spacer" | "table" | "list",
                    content: "Nomor: {{nomor_surat}}", // with variables
                    style: {
                        font_family: null, // null = use default
                        font_size: null,
                        font_weight: "normal",
                        font_style: "normal",
                        text_align: "left" | "center" | "right" | "justify",
                        line_height: null, // null = use default
                        margin_top: 0,
                        margin_bottom: 0,
                        margin_left: 0,
                        margin_right: 0,
                        indent_first_line: 0, // mm, for paragraph
                        letter_spacing: 0
                    },
                    // For table type
                    table_config: {
                        columns: [...],
                        rows: [...],
                        border: true
                    }
                }
            ]
            */
            
            // Footer Settings
            $table->json('footer_settings')->nullable();
            /*
            {
                enabled: false,
                height: 15,
                content: "Halaman {{page}} dari {{total_pages}}",
                text_align: "center",
                font_size: 10
            }
            */
            
            // Signature Settings
            $table->json('signature_settings');
            /*
            {
                margin_top: 20, // mm
                layout: "1-column" | "2-column" | "3-column" | "4-column",
                column_gap: 10, // mm between columns
                slots: [
                    {
                        id: "uuid",
                        column: 0, // 0-based column index
                        order: 0, // order within column
                        label_above: "Mengetahui,",
                        label_position: "Kepala Dinas Pendidikan",
                        show_name: true,
                        show_nip: true,
                        signature_height: 25, // mm - space for signature
                        text_align: "center",
                        font_size: 12
                    }
                ]
            }
            */
            
            // Variables definition
            $table->json('variables');
            /*
            [
                {
                    key: "nomor_surat",
                    label: "Nomor Surat",
                    type: "text" | "textarea" | "date" | "number" | "select",
                    required: true,
                    default_value: null,
                    options: [], // for select type
                    placeholder: "001/SK/2024"
                }
            ]
            */
            
            // Numbering format
            $table->string('numbering_format')->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_templates');
    }
};
