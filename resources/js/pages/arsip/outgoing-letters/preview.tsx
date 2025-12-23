import { Head } from '@inertiajs/react';
import { DocumentTemplate } from '@/types/document-template';
import { TemplatePreview } from '@/components/document-template/template-preview';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { useRef } from 'react';

interface Signatory {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        nip?: string;
    };
    slot_id: string;
    sign_order: number;
    status: 'pending' | 'approved' | 'rejected';
    notes: string | null;
    signed_at: string | null;
    slot_info?: {
        label_above?: string;
        label_position?: string;
    } | null;
}

interface OutgoingLetter {
    id: number;
    letter_number: string | null;
    subject: string;
    letter_date: string;
    status: 'pending_approval' | 'partially_signed' | 'fully_signed' | 'rejected' | 'revision_requested';
    variable_values: Record<string, any>;
    template: DocumentTemplate;
    signatories: Signatory[];
}

interface Props {
    letter: OutgoingLetter;
    paper_sizes: Record<string, { width: number; height: number }>;
}

export default function Preview({ letter, paper_sizes }: Props) {
    const previewRef = useRef<HTMLDivElement>(null);
    const template = letter.template;

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        window.close();
    };

    // Merge variable values with letter number
    const mergedVariableValues = {
        ...letter.variable_values,
        nomor_surat: letter.letter_number || '(Nomor akan dibuat)',
    };

    // Build signatoriesData for preview
    const signatoriesData = (letter.signatories || []).map(s => ({
        slot_id: s.slot_id,
        name: s.user?.name || '',
        nip: s.user?.nip || '',
        signed: s.status === 'approved',
        signed_at: s.signed_at,
    }));

    // Verification URL for QR code
    const verificationUrl = letter.status === 'fully_signed' 
        ? `${window.location.origin}/verify/letter/${letter.id}` 
        : undefined;

    // Process content blocks with variable values
    const processedContentBlocks = template.content_blocks.map(block => {
        let processedContent = block.content || '';
        
        // Replace {{variable}} with actual data
        Object.entries(mergedVariableValues).forEach(([key, value]) => {
            processedContent = processedContent.replace(
                new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                String(value)
            );
        });

        // Also process field-group items
        let processedFieldGroup = block.field_group;
        if (block.field_group) {
            processedFieldGroup = {
                ...block.field_group,
                items: block.field_group.items.map(item => {
                    let processedValue = item.value || '';
                    Object.entries(mergedVariableValues).forEach(([key, value]) => {
                        processedValue = processedValue.replace(
                            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                            String(value)
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
            <Head title={`Preview: ${letter.letter_number || letter.subject}`} />

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
                                <h1 className="font-semibold">{letter.letter_number || letter.subject}</h1>
                                <p className="text-xs text-muted-foreground">Preview Surat Keluar</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Printer className="h-4 w-4 mr-2" />
                                Cetak / Download PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Preview Container */}
                <div className="print-container py-8" ref={previewRef}>
                    <div className="flex justify-center">
                        <TemplatePreview
                            pageSettings={template.page_settings}
                            headerSettings={template.header_settings}
                            contentBlocks={processedContentBlocks}
                            signatureSettings={template.signature_settings}
                            footerSettings={template.footer_settings}
                            scale={1}
                            variableValues={mergedVariableValues}
                            signatoriesData={signatoriesData}
                            verificationUrl={verificationUrl}
                            showQrCode={letter.status === 'fully_signed'}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
