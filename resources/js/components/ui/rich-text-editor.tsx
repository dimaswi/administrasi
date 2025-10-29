import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useEffect } from 'react';
import { 
    Bold, 
    Italic, 
    Underline as UnderlineIcon, 
    List, 
    ListOrdered, 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    Undo, 
    Redo 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Mulai menulis...', className }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder,
            }),
            TextStyle,
            Color,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
            },
        },
    });

    // Update editor content when value changes externally
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={cn('border rounded-md', className)}>
            {/* Toolbar */}
            <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
                {/* Text Formatting */}
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleBold().run();
                    }}
                    className={cn(
                        'p-2 rounded hover:bg-gray-200 transition-colors',
                        editor.isActive('bold') && 'bg-gray-300'
                    )}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleItalic().run();
                    }}
                    className={cn(
                        'p-2 rounded hover:bg-gray-200 transition-colors',
                        editor.isActive('italic') && 'bg-gray-300'
                    )}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleUnderline().run();
                    }}
                    className={cn(
                        'p-2 rounded hover:bg-gray-200 transition-colors',
                        editor.isActive('underline') && 'bg-gray-300'
                    )}
                    title="Underline (Ctrl+U)"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Lists */}
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleBulletList().run();
                    }}
                    className={cn(
                        'p-2 rounded hover:bg-gray-200 transition-colors',
                        editor.isActive('bulletList') && 'bg-gray-300'
                    )}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleOrderedList().run();
                    }}
                    className={cn(
                        'p-2 rounded hover:bg-gray-200 transition-colors',
                        editor.isActive('orderedList') && 'bg-gray-300'
                    )}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Text Alignment */}
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().setTextAlign('left').run();
                    }}
                    className={cn(
                        'p-2 rounded hover:bg-gray-200 transition-colors',
                        editor.isActive({ textAlign: 'left' }) && 'bg-gray-300'
                    )}
                    title="Align Left"
                >
                    <AlignLeft className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().setTextAlign('center').run();
                    }}
                    className={cn(
                        'p-2 rounded hover:bg-gray-200 transition-colors',
                        editor.isActive({ textAlign: 'center' }) && 'bg-gray-300'
                    )}
                    title="Align Center"
                >
                    <AlignCenter className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().setTextAlign('right').run();
                    }}
                    className={cn(
                        'p-2 rounded hover:bg-gray-200 transition-colors',
                        editor.isActive({ textAlign: 'right' }) && 'bg-gray-300'
                    )}
                    title="Align Right"
                >
                    <AlignRight className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Heading Levels */}
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleHeading({ level: 1 }).run();
                    }}
                    className={cn(
                        'px-3 py-2 rounded hover:bg-gray-200 text-sm font-semibold transition-colors',
                        editor.isActive('heading', { level: 1 }) && 'bg-gray-300'
                    )}
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleHeading({ level: 2 }).run();
                    }}
                    className={cn(
                        'px-3 py-2 rounded hover:bg-gray-200 text-sm font-semibold transition-colors',
                        editor.isActive('heading', { level: 2 }) && 'bg-gray-300'
                    )}
                    title="Heading 2"
                >
                    H2
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleHeading({ level: 3 }).run();
                    }}
                    className={cn(
                        'px-3 py-2 rounded hover:bg-gray-200 text-sm font-semibold transition-colors',
                        editor.isActive('heading', { level: 3 }) && 'bg-gray-300'
                    )}
                    title="Heading 3"
                >
                    H3
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Undo/Redo */}
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().undo().run();
                    }}
                    disabled={!editor.can().undo()}
                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().redo().run();
                    }}
                    disabled={!editor.can().redo()}
                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Redo (Ctrl+Y)"
                >
                    <Redo className="h-4 w-4" />
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}
