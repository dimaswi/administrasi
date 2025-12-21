import { Head } from '@inertiajs/react';
import { DocumentTemplate } from '@/types/document-template';
import { TemplatePreview } from '@/components/document-template/template-preview';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Download } from 'lucide-react';

interface Props {
    template: DocumentTemplate & {
        created_at: string;
        updated_at: string;
    };
    sample_data: Record<string, string>;
}

export default function Preview({ template, sample_data }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        window.close();
    };

    // Replace variables in content blocks with sample data
    const processedContentBlocks = template.content_blocks.map(block => {
        let processedContent = block.content || '';
        
        // Replace {{variable}} with sample data
        Object.entries(sample_data).forEach(([key, value]) => {
            processedContent = processedContent.replace(
                new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                value
            );
        });

        // Also process field-group items
        let processedFieldGroup = block.field_group;
        if (block.field_group) {
            processedFieldGroup = {
                ...block.field_group,
                items: block.field_group.items.map(item => {
                    let processedValue = item.value || '';
                    Object.entries(sample_data).forEach(([key, value]) => {
                        processedValue = processedValue.replace(
                            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                            value
                        );
                    });
                    return { ...item, value: processedValue };
                }),
            };
        }

        return {
            ...block,
            content: processedContent,
            field_group: processedFieldGroup,
        };
    });

    return (
        <>
            <Head title={`Preview: ${template.name}`} />

            {/* Print styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                    }
                    .print-container {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-gray-100">
                {/* Toolbar */}
                <div className="no-print sticky top-0 z-50 bg-white border-b shadow-sm">
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Tutup
                            </Button>
                            <div>
                                <h1 className="font-semibold">{template.name}</h1>
                                <p className="text-xs text-muted-foreground">Preview Template</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Printer className="h-4 w-4 mr-2" />
                                Cetak
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Preview Container */}
                <div className="print-container py-8">
                    <div className="flex justify-center">
                        <TemplatePreview
                            pageSettings={template.page_settings}
                            headerSettings={template.header_settings}
                            contentBlocks={processedContentBlocks}
                            signatureSettings={template.signature_settings}
                            footerSettings={template.footer_settings}
                            scale={1}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
