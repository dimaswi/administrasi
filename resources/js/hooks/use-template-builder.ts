import { useState, useCallback } from 'react';
import { DocumentTemplate, PageSettings, HeaderSettings, ContentBlock, SignatureSettings, TemplateVariable, FooterSettings, SignatureSlot, defaultSignatureSlot, defaultContentBlock, HeaderTextLine, BlockStyle, defaultBlockStyle, defaultLetterOpeningConfig } from '@/types/document-template';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const defaultPageSettings: PageSettings = {
    paper_size: 'A4',
    orientation: 'portrait',
    margins: {
        top: 25,
        bottom: 25,
        left: 30,
        right: 25,
    },
    default_font: {
        family: 'Times New Roman',
        size: 12,
        line_height: 1.5,
    },
};

export const defaultHeaderSettings: HeaderSettings = {
    enabled: false,
    height: 40,
    margin_bottom: 10,
    use_image: false,
    header_image: {
        enabled: false,
        src: null,
        height: null,
    },
    logo: {
        enabled: false,
        position: 'left',
        width: 25,
        height: null,
        src: null,
        margin: 5,
    },
    text_lines: [],
    border_bottom: {
        enabled: true,
        style: 'double',
        width: 2,
        color: '#000000',
    },
};

export const defaultSignatureSettings: SignatureSettings = {
    margin_top: 30,
    layout: '2-column',
    column_gap: 20,
    page_position: 'last',
    slots: [],
};

export const defaultFooterSettings: FooterSettings = {
    enabled: false,
    height: 20,
    content: '',
    text_align: 'center',
    font_size: 10,
};

export function useTemplateBuilder(initialTemplate?: Partial<DocumentTemplate>) {
    const [template, setTemplate] = useState<DocumentTemplate>({
        name: '',
        code: '',
        category: null,
        description: null,
        page_settings: initialTemplate?.page_settings || { ...defaultPageSettings },
        header_settings: initialTemplate?.header_settings || { ...defaultHeaderSettings },
        content_blocks: initialTemplate?.content_blocks || [],
        footer_settings: initialTemplate?.footer_settings || null,
        signature_settings: initialTemplate?.signature_settings || { ...defaultSignatureSettings },
        variables: initialTemplate?.variables || [],
        numbering_format: initialTemplate?.numbering_format || null,
        is_active: initialTemplate?.is_active ?? true,
        ...initialTemplate,
    });

    // General setters
    const updateTemplate = useCallback((updates: Partial<DocumentTemplate>) => {
        setTemplate(prev => ({ ...prev, ...updates }));
    }, []);

    // Page settings
    const updatePageSettings = useCallback((updates: Partial<PageSettings>) => {
        setTemplate(prev => ({
            ...prev,
            page_settings: { ...prev.page_settings, ...updates },
        }));
    }, []);

    const updateMargins = useCallback((updates: Partial<PageSettings['margins']>) => {
        setTemplate(prev => ({
            ...prev,
            page_settings: {
                ...prev.page_settings,
                margins: { ...prev.page_settings.margins, ...updates },
            },
        }));
    }, []);

    const updateDefaultFont = useCallback((updates: Partial<PageSettings['default_font']>) => {
        setTemplate(prev => ({
            ...prev,
            page_settings: {
                ...prev.page_settings,
                default_font: { ...prev.page_settings.default_font, ...updates },
            },
        }));
    }, []);

    // Header settings
    const updateHeaderSettings = useCallback((updates: Partial<HeaderSettings>) => {
        setTemplate(prev => ({
            ...prev,
            header_settings: { ...prev.header_settings, ...updates },
        }));
    }, []);

    const updateHeaderLogo = useCallback((updates: Partial<HeaderSettings['logo']>) => {
        setTemplate(prev => ({
            ...prev,
            header_settings: {
                ...prev.header_settings,
                logo: { ...prev.header_settings.logo, ...updates },
            },
        }));
    }, []);

    const updateHeaderBorder = useCallback((updates: Partial<HeaderSettings['border_bottom']>) => {
        setTemplate(prev => ({
            ...prev,
            header_settings: {
                ...prev.header_settings,
                border_bottom: { ...prev.header_settings.border_bottom, ...updates },
            },
        }));
    }, []);

    const addHeaderTextLine = useCallback(() => {
        setTemplate(prev => ({
            ...prev,
            header_settings: {
                ...prev.header_settings,
                text_lines: [
                    ...prev.header_settings.text_lines,
                    {
                        id: generateId(),
                        content: '',
                        font_family: null,
                        font_size: 14,
                        font_weight: 'normal',
                        font_style: 'normal',
                        text_align: 'center',
                        letter_spacing: 0,
                        margin_bottom: 2,
                    } as HeaderTextLine,
                ],
            },
        }));
    }, []);

    const updateHeaderTextLine = useCallback((id: string, updates: Partial<HeaderTextLine>) => {
        setTemplate(prev => ({
            ...prev,
            header_settings: {
                ...prev.header_settings,
                text_lines: prev.header_settings.text_lines.map(line =>
                    line.id === id ? { ...line, ...updates } : line
                ),
            },
        }));
    }, []);

    const removeHeaderTextLine = useCallback((id: string) => {
        setTemplate(prev => ({
            ...prev,
            header_settings: {
                ...prev.header_settings,
                text_lines: prev.header_settings.text_lines.filter(line => line.id !== id),
            },
        }));
    }, []);

    const reorderHeaderTextLines = useCallback((fromIndex: number, toIndex: number) => {
        setTemplate(prev => {
            const newLines = [...prev.header_settings.text_lines];
            const [movedLine] = newLines.splice(fromIndex, 1);
            newLines.splice(toIndex, 0, movedLine);
            return {
                ...prev,
                header_settings: {
                    ...prev.header_settings,
                    text_lines: newLines,
                },
            };
        });
    }, []);

    // Content blocks
    const addContentBlock = useCallback((type: ContentBlock['type'] = 'paragraph') => {
        setTemplate(prev => ({
            ...prev,
            content_blocks: [
                ...prev.content_blocks,
                {
                    ...defaultContentBlock,
                    id: generateId(),
                    type,
                    style: {
                        ...defaultBlockStyle,
                        margin_bottom: type === 'page-break' ? 0 : 10,
                        indent_first_line: type === 'paragraph' ? 12.7 : 0,
                        text_align: type === 'paragraph' ? 'justify' : 'left',
                    },
                    // Add field_group config for field-group type
                    ...(type === 'field-group' && {
                        field_group: {
                            label_width: 25,
                            separator: ':',
                            items: [],
                        },
                    }),
                    // Add page_break config for page-break type
                    ...(type === 'page-break' && {
                        page_break: {
                            show_header: true,
                        },
                    }),
                    // Add letter_opening config for letter-opening type
                    ...(type === 'letter-opening' && {
                        letter_opening: { ...defaultLetterOpeningConfig },
                    }),
                },
            ],
        }));
    }, []);

    const updateContentBlock = useCallback((id: string, updates: Partial<ContentBlock>) => {
        setTemplate(prev => ({
            ...prev,
            content_blocks: prev.content_blocks.map(block =>
                block.id === id ? { ...block, ...updates } : block
            ),
        }));
    }, []);

    const updateContentBlockStyle = useCallback((id: string, styleUpdates: Partial<BlockStyle>) => {
        setTemplate(prev => ({
            ...prev,
            content_blocks: prev.content_blocks.map(block =>
                block.id === id 
                    ? { ...block, style: { ...block.style, ...styleUpdates } } 
                    : block
            ),
        }));
    }, []);

    const removeContentBlock = useCallback((id: string) => {
        setTemplate(prev => ({
            ...prev,
            content_blocks: prev.content_blocks.filter(block => block.id !== id),
        }));
    }, []);

    const reorderContentBlocks = useCallback((fromIndex: number, toIndex: number) => {
        setTemplate(prev => {
            const newBlocks = [...prev.content_blocks];
            const [movedBlock] = newBlocks.splice(fromIndex, 1);
            newBlocks.splice(toIndex, 0, movedBlock);
            return {
                ...prev,
                content_blocks: newBlocks,
            };
        });
    }, []);

    const duplicateContentBlock = useCallback((id: string) => {
        setTemplate(prev => {
            const blockIndex = prev.content_blocks.findIndex(b => b.id === id);
            if (blockIndex === -1) return prev;
            const block = prev.content_blocks[blockIndex];
            const newBlock = { ...block, id: generateId() };
            const newBlocks = [...prev.content_blocks];
            newBlocks.splice(blockIndex + 1, 0, newBlock);
            return {
                ...prev,
                content_blocks: newBlocks,
            };
        });
    }, []);

    // Signature settings
    const updateSignatureSettings = useCallback((updates: Partial<SignatureSettings>) => {
        setTemplate(prev => ({
            ...prev,
            signature_settings: { ...prev.signature_settings, ...updates },
        }));
    }, []);

    const addSignatureSlot = useCallback((column: number = 0) => {
        setTemplate(prev => {
            const slotsInColumn = prev.signature_settings.slots.filter(s => s.column === column);
            return {
                ...prev,
                signature_settings: {
                    ...prev.signature_settings,
                    slots: [
                        ...prev.signature_settings.slots,
                        {
                            ...defaultSignatureSlot,
                            id: generateId(),
                            column,
                            order: slotsInColumn.length,
                        },
                    ],
                },
            };
        });
    }, []);

    const updateSignatureSlot = useCallback((id: string, updates: Partial<SignatureSlot>) => {
        setTemplate(prev => ({
            ...prev,
            signature_settings: {
                ...prev.signature_settings,
                slots: prev.signature_settings.slots.map(slot =>
                    slot.id === id ? { ...slot, ...updates } : slot
                ),
            },
        }));
    }, []);

    const removeSignatureSlot = useCallback((id: string) => {
        setTemplate(prev => ({
            ...prev,
            signature_settings: {
                ...prev.signature_settings,
                slots: prev.signature_settings.slots.filter(slot => slot.id !== id),
            },
        }));
    }, []);

    // Footer settings
    const updateFooterSettings = useCallback((updates: Partial<FooterSettings>) => {
        setTemplate(prev => ({
            ...prev,
            footer_settings: prev.footer_settings 
                ? { ...prev.footer_settings, ...updates }
                : { ...defaultFooterSettings, ...updates },
        }));
    }, []);

    const toggleFooter = useCallback((enabled: boolean) => {
        setTemplate(prev => ({
            ...prev,
            footer_settings: enabled 
                ? { ...defaultFooterSettings, enabled: true }
                : null,
        }));
    }, []);

    // Variables
    const addVariable = useCallback(() => {
        setTemplate(prev => ({
            ...prev,
            variables: [
                ...prev.variables,
                {
                    key: `var_${generateId()}`,
                    label: '',
                    type: 'text',
                    source: 'manual',
                    required: false,
                    readonly: false,
                    default_value: null,
                    options: [],
                    placeholder: '',
                },
            ],
        }));
    }, []);

    const updateVariable = useCallback((index: number, updates: Partial<TemplateVariable>) => {
        setTemplate(prev => ({
            ...prev,
            variables: prev.variables.map((v, i) => i === index ? { ...v, ...updates } : v),
        }));
    }, []);

    const removeVariable = useCallback((index: number) => {
        setTemplate(prev => ({
            ...prev,
            variables: prev.variables.filter((_, i) => i !== index),
        }));
    }, []);

    // Reset to defaults
    const resetPageSettings = useCallback(() => {
        setTemplate(prev => ({
            ...prev,
            page_settings: { ...defaultPageSettings },
        }));
    }, []);

    const resetHeaderSettings = useCallback(() => {
        setTemplate(prev => ({
            ...prev,
            header_settings: { ...defaultHeaderSettings },
        }));
    }, []);

    return {
        template,
        setTemplate,
        updateTemplate,
        // Page settings
        updatePageSettings,
        updateMargins,
        updateDefaultFont,
        resetPageSettings,
        // Header settings
        updateHeaderSettings,
        updateHeaderLogo,
        updateHeaderBorder,
        addHeaderTextLine,
        updateHeaderTextLine,
        removeHeaderTextLine,
        reorderHeaderTextLines,
        resetHeaderSettings,
        // Content blocks
        addContentBlock,
        updateContentBlock,
        updateContentBlockStyle,
        removeContentBlock,
        reorderContentBlocks,
        duplicateContentBlock,
        // Signature settings
        updateSignatureSettings,
        addSignatureSlot,
        updateSignatureSlot,
        removeSignatureSlot,
        // Footer settings
        updateFooterSettings,
        toggleFooter,
        // Variables
        addVariable,
        updateVariable,
        removeVariable,
    };
}
