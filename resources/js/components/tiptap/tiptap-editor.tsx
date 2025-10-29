import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { useImperativeHandle, forwardRef } from 'react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Underline } from '@tiptap/extension-underline';
import { Variable } from './variable-extension';
import { Letterhead } from './letterhead-extension';
import { FontSize, LineHeight } from './font-extensions';
import { Indent } from '@/extensions/indent';
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
    onInsertLetterhead?: () => void;
}

export interface TipTapEditorRef {
    insertVariable: (name: string) => void;
    insertLetterhead: (data: any) => void;
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(({
    content,
    onChange,
    placeholder = 'Tulis konten template di sini...',
    editable = true,
    onInsertVariable,
    onInsertLetterhead,
}, ref) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Table.configure({
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
            Underline,
            FontSize,
            LineHeight,
            Indent.configure({
                types: ['paragraph', 'heading', 'listItem'],
                indentLevels: [0, 30, 60, 90, 120, 150, 180, 210, 240],
                defaultIndentLevel: 0,
            }),
            Variable,
            Letterhead,
        ],
        content,
        editable,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none',
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
                editor.chain().focus().insertContent({
                    type: 'variable',
                    attrs: { name },
                }).run();
            }
        },
        insertLetterhead: (data: any) => {
            if (editor) {
                editor.chain().focus().insertContent({
                    type: 'letterhead',
                    attrs: data,
                }).run();
            }
        },
    }));

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-gray-100">
            {/* Toolbar */}
            {editable && <MenuBar editor={editor} onInsertVariable={onInsertVariable} onInsertLetterhead={onInsertLetterhead} />}

            {/* A4 Paper Container - 210mm x 297mm at 96 DPI = 794px x 1123px */}
            <div className="p-4 overflow-x-auto">
                <div className="mx-auto bg-white shadow-lg" style={{ width: '794px', minHeight: '1123px' }}>
                    <EditorContent
                        editor={editor}
                        className={cn(
                            'prose prose-sm max-w-none p-8 focus:outline-none',
                            'dark:prose-invert',
                            '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[1123px]'
                        )}
                    />
                </div>
            </div>
        </div>
    );
});

function MenuBar({ editor, onInsertVariable, onInsertLetterhead }: { 
    editor: Editor; 
    onInsertVariable?: () => void; 
    onInsertLetterhead?: () => void;
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

            {/* Table */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleButtonClick(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
            >
                <TableIcon className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Custom Elements */}
            {onInsertLetterhead && (
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleButtonClick(onInsertLetterhead)}
                >
                    📝 Kop Surat
                </Button>
            )}
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
        </div>
    );
}
