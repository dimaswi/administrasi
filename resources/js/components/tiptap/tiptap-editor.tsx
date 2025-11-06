import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { useImperativeHandle, forwardRef } from 'react';
import StarterKit from '@tiptap/starter-kit';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Variable, VariableNode } from './variable-extension';
import { Signature } from './signature-extension';
import { FontSize, LineHeight } from './font-extensions';
import { Indent } from '@/extensions/indent';
import { TableExtended } from './extensions/table-extended';
import { Tab } from './extensions/tab-extension';
import { PageBreak } from './extensions/page-break-extension';
import { AlignmentTable, AlignmentTableRow, AlignmentTableCell } from './alignment-table-extension';
import { SignatureBlock } from './signature-block-extension';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Table as TableIcon,
    Image as ImageIcon,
    Heading1,
    Heading2,
    Heading3,
    FileText,
    Type,
    LineChart,
    IndentDecrease,
    IndentIncrease,
    FileDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TipTapEditorProps {
    content?: any;
    onChange?: (content: any) => void;
    placeholder?: string;
    editable?: boolean;
    onInsertVariable?: () => void;
    onInsertSignature?: () => void;
}

export interface TipTapEditorRef {
    insertVariable: (name: string) => void;
    insertSignature: (data: any) => void;
    insertSignatureRow: (signatures: Array<any>) => void;
    insertSignatureName: (userName: string) => void;
    removeSignatureByUserId: (userId: number) => void;
    getHTML: () => string;
    getJSON: () => any;
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(({
    content,
    onChange,
    placeholder = 'Tulis konten template di sini...',
    editable = true,
    onInsertVariable,
    onInsertSignature,
}, ref) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // StarterKit includes: bold, italic, strike, code, history, paragraph, text, heading, bulletList, orderedList, listItem, blockquote, codeBlock, horizontalRule, hardBreak, dropcursor, gapcursor
                // We don't need to add them separately
            }),
            TableExtended.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Image,
            Placeholder.configure({
                placeholder,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            FontFamily.configure({
                types: ['textStyle'],
            }),
            FontSize,
            LineHeight,
            Indent.configure({
                types: ['paragraph', 'heading', 'listItem'],
                indentLevels: [0, 30, 60, 90, 120, 150, 180, 210, 240],
                defaultIndentLevel: 0,
            }),
            Variable,
            VariableNode, // Backward compatibility for old Node-based variables
            Signature, // Keep for backward compatibility with old templates
            SignatureBlock, // New signature for alignment table
            Tab, // Enable Tab key for spacing
            PageBreak, // Page break untuk halaman baru
            AlignmentTable,
            AlignmentTableRow,
            AlignmentTableCell,
        ],
        content,
        editable,
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
                style: 'outline: none;',
            },
        },
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getJSON());
            }
        },
    });

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        insertVariable: (name: string) => {
            if (editor) {
                const varText = `{{${name}}}`;
                editor.chain().focus()
                    .insertContent({
                        type: 'text',
                        text: varText,
                        marks: [
                            {
                                type: 'variable',
                                attrs: { name },
                            },
                        ],
                    })
                    .insertContent(' ')
                    .run();
            }
        },
        insertSignature: (data: any) => {
            if (editor) {
                // For backward compatibility with old Signature extension
                editor.chain().focus().insertSignature(data).run();
            }
        },
        insertSignatureRow: (signatures: Array<any>) => {
            if (editor) {
                editor.chain().focus().insertSignatureRow(signatures).run();
            }
        },
        insertSignatureName: (userName: string) => {
            if (editor) {
                // Insert HANYA nama user sebagai plain text
                editor.chain().focus().insertContent(userName + ' ').run();
            }
        },
        removeSignatureByUserId: (userId: number) => {
            if (editor) {
                // Traverse editor content and remove all signature nodes with matching userId
                const { state, view } = editor;
                const tr = state.tr;
                let hasChanges = false;

                state.doc.descendants((node, pos) => {
                    if ((node.type.name === 'signature' || node.type.name === 'signatureBlock') && node.attrs.userId === userId) {
                        tr.delete(pos, pos + node.nodeSize);
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    view.dispatch(tr);
                }
            }
        },
        getHTML: () => {
            return editor?.getHTML() || '';
        },
        getJSON: () => {
            return editor?.getJSON() || { type: 'doc', content: [] };
        },
    }));

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-gray-100">
            {/* Toolbar */}
            {editable && <MenuBar editor={editor} onInsertVariable={onInsertVariable} onInsertSignature={onInsertSignature} />}

            {/* A4 Paper - padding balance untuk kemudahan editing */}
            <div className="p-4 overflow-x-auto">
                <div className="mx-auto bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '10mm 15mm 15mm 15mm', boxSizing: 'border-box' }}>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                            /* Reset ProseMirror defaults untuk presisi */
                            .ProseMirror {
                                font-family: 'Times New Roman', serif;
                                font-size: 12pt;
                                line-height: 1.5;
                                color: #000;
                                outline: none;
                                caret-color: #000;
                                min-height: 200px;
                            }
                            
                            .ProseMirror:focus {
                                outline: none;
                            }
                            
                            .ProseMirror p {
                                margin: 0;
                                line-height: 1.5;
                            }
                            
                            .ProseMirror h1 {
                                font-size: 16pt;
                                line-height: 1.3;
                                margin: 0.5em 0;
                            }
                            
                            .ProseMirror h2 {
                                font-size: 14pt;
                                line-height: 1.3;
                                margin: 0.5em 0;
                            }
                            
                            .ProseMirror h3 {
                                font-size: 13pt;
                                line-height: 1.3;
                                margin: 0.5em 0;
                            }
                            
                            .ProseMirror ul,
                            .ProseMirror ol {
                                padding-left: 1.5em;
                                margin: 0.5em 0;
                            }
                            
                            .ProseMirror li {
                                line-height: 1.5;
                            }
                            
                            /* Table styles */
                            .ProseMirror table {
                                border-collapse: collapse;
                                table-layout: fixed;
                                width: 100%;
                                margin: 1em 0;
                                overflow: hidden;
                            }
                            
                            .ProseMirror table td,
                            .ProseMirror table th {
                                min-width: 1em;
                                border: 1px solid #000;
                                padding: 4px 6px;
                                vertical-align: top;
                                box-sizing: border-box;
                                position: relative;
                                line-height: 1.5;
                            }
                            
                            /* Borderless table for aligned lists */
                            .ProseMirror table.borderless td,
                            .ProseMirror table.borderless th {
                                border: none;
                                padding: 2px 8px;
                            }
                            
                            .ProseMirror table.borderless td:first-child {
                                width: 150px;
                                white-space: nowrap;
                            }
                            
                            .ProseMirror table th {
                                font-weight: bold;
                                text-align: left;
                                background-color: #f3f4f6;
                            }
                            
                            .ProseMirror table .selectedCell:after {
                                z-index: 2;
                                position: absolute;
                                content: "";
                                left: 0; right: 0; top: 0; bottom: 0;
                                background: rgba(200, 200, 255, 0.4);
                                pointer-events: none;
                            }
                            
                            .ProseMirror table .column-resize-handle {
                                position: absolute;
                                right: -2px;
                                top: 0;
                                bottom: -2px;
                                width: 4px;
                                background-color: #adf;
                                pointer-events: none;
                            }
                            
                            .ProseMirror .tableWrapper {
                                padding: 1rem 0;
                                overflow-x: auto;
                            }
                            
                            .ProseMirror .resize-cursor {
                                cursor: ew-resize;
                                cursor: col-resize;
                            }
                            
                            /* Image */
                            .ProseMirror img {
                                max-width: 100%;
                                height: auto;
                            }
                            
                            /* Page Break - Visual Halaman Baru */
                            .ProseMirror div[data-type="page-break"] {
                                page-break-after: always;
                                break-after: page;
                                margin: 30px 0;
                                padding: 0;
                                position: relative;
                                height: 1px;
                            }
                            
                            .ProseMirror div[data-type="page-break"]::before {
                                content: '';
                                position: absolute;
                                left: 50%;
                                transform: translateX(-50%);
                                width: 210mm;
                                top: 0;
                                height: 1px;
                                border-top: 2px dashed #cbd5e1;
                            }
                            
                            .ProseMirror div[data-type="page-break"]::after {
                                content: '📄 Halaman Baru';
                                position: absolute;
                                left: 50%;
                                transform: translateX(-50%);
                                top: -12px;
                                background: white;
                                padding: 4px 12px;
                                color: #64748b;
                                font-size: 11px;
                                font-weight: 500;
                                border-radius: 4px;
                                border: 1px solid #cbd5e1;
                                white-space: nowrap;
                                z-index: 1;
                            }
                            
                            @media print {
                                .ProseMirror div[data-type="page-break"] {
                                    margin: 0;
                                    padding: 0;
                                    height: 0;
                                    background: none;
                                    border: none;
                                }
                                
                                .ProseMirror div[data-type="page-break"]::after {
                                    display: none;
                                }
                            }
                        `
                    }} />
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
});

function MenuBar({ editor, onInsertVariable, onInsertSignature }: { 
    editor: Editor; 
    onInsertVariable?: () => void; 
    onInsertSignature?: () => void;
}) {
    const handleButtonClick = (callback: () => void) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
    };

    return (
        <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1">
            {/* Headings */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Heading
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>
                        <Heading1 className="h-4 w-4 mr-2" />
                        Heading 1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
                        <Heading2 className="h-4 w-4 mr-2" />
                        Heading 2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
                        <Heading3 className="h-4 w-4 mr-2" />
                        Heading 3
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Text Formatting */}
            <Button
                type="button"
                variant={editor.isActive('bold') ? 'default' : 'ghost'}
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().toggleBold().run())}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant={editor.isActive('italic') ? 'default' : 'ghost'}
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().toggleItalic().run())}
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant={editor.isActive('underline') ? 'default' : 'ghost'}
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().toggleUnderline().run())}
            >
                <UnderlineIcon className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Lists */}
            <Button
                type="button"
                variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().toggleBulletList().run())}
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().toggleOrderedList().run())}
            >
                <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Indentation */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().outdent().run())}
                title="Decrease Indent (Shift+Tab)"
            >
                <IndentDecrease className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().indent().run())}
                title="Increase Indent (Tab)"
            >
                <IndentIncrease className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Alignment */}
            <Button
                type="button"
                variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().setTextAlign('left').run())}
            >
                <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().setTextAlign('center').run())}
            >
                <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().setTextAlign('right').run())}
            >
                <AlignRight className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().setTextAlign('justify').run())}
            >
                <AlignJustify className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Font Family */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="sm">
                        <Type className="h-4 w-4 mr-2" />
                        Font
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().setFontFamily('Arial').run())}>
                        <span style={{ fontFamily: 'Arial' }}>Arial</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().setFontFamily('Times New Roman').run())}>
                        <span style={{ fontFamily: 'Times New Roman' }}>Times New Roman</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().setFontFamily('Calibri').run())}>
                        <span style={{ fontFamily: 'Calibri' }}>Calibri</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().setFontFamily('Tahoma').run())}>
                        <span style={{ fontFamily: 'Tahoma' }}>Tahoma</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().setFontFamily('Georgia').run())}>
                        <span style={{ fontFamily: 'Georgia' }}>Georgia</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().setFontFamily('Courier New').run())}>
                        <span style={{ fontFamily: 'Courier New' }}>Courier New</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().unsetFontFamily().run())}>
                        Default
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Font Size */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="sm">
                        Size
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {['10', '11', '12', '14', '16', '18', '20', '24', '28', '32'].map(size => (
                        <DropdownMenuItem key={size} onClick={handleButtonClick(() => editor.chain().focus().setFontSize(`${size}px`).run())}>
                            {size}pt
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Line Height */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="sm">
                        <LineChart className="h-4 w-4 mr-2" />
                        Line
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {['0.5', '0.6', '0.7', '0.8', '0.9', '1.0', '1.15', '1.5', '1.75', '2.0', '2.5', '3.0'].map(height => (
                        <DropdownMenuItem key={height} onClick={handleButtonClick(() => editor.chain().focus().setLineHeight(height).run())}>
                            {height}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Table Controls */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="sm">
                        <TableIcon className="h-4 w-4 mr-2" />
                        Table
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}>
                        Insert Table (3x3)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().insertAlignmentTable().run())}>
                        Insert Alignment Table (2 cols)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().addColumnBefore().run())} disabled={!editor.can().addColumnBefore()}>
                        Add Column Before
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().addColumnAfter().run())} disabled={!editor.can().addColumnAfter()}>
                        Add Column After
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().deleteColumn().run())} disabled={!editor.can().deleteColumn()}>
                        Delete Column
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().addRowBefore().run())} disabled={!editor.can().addRowBefore()}>
                        Add Row Before
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().addRowAfter().run())} disabled={!editor.can().addRowAfter()}>
                        Add Row After
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().deleteRow().run())} disabled={!editor.can().deleteRow()}>
                        Delete Row
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().deleteTable().run())} disabled={!editor.can().deleteTable()} className="text-destructive">
                        Delete Table
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().mergeCells().run())} disabled={!editor.can().mergeCells()}>
                        Merge Cells
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleButtonClick(() => editor.chain().focus().splitCell().run())} disabled={!editor.can().splitCell()}>
                        Split Cell
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Page Break */}
            <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleButtonClick(() => editor.chain().focus().setPageBreak().run())}
                title="Insert Page Break - Halaman Baru (Ctrl+Enter)"
            >
                <FileDown className="h-4 w-4 mr-2" />
                Halaman Baru
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Custom Elements */}
            {onInsertVariable && (
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleButtonClick(onInsertVariable)}
                >
                    {`{{ }}`} Variable
                </Button>
            )}
            {onInsertSignature && (
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleButtonClick(onInsertSignature)}
                >
                    ✍️ Tanda Tangan
                </Button>
            )}
        </div>
    );
}
