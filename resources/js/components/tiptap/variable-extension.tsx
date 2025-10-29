import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';

// Variable Node Extension
export const Variable = Node.create({
    name: 'variable',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            name: {
                default: null,
            },
            label: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-variable]',
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-variable': node.attrs.name,
                'class': 'variable-placeholder',
                'style': 'display: inline-block;',
            }),
            `{{${node.attrs.name}}}`,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(VariableComponent);
    },
    
    addKeyboardShortcuts() {
        return {
            // Allow typing after variable with space or arrow keys
            'ArrowRight': ({ editor }) => {
                const { selection } = editor.state;
                const { $from } = selection;
                
                // Check if we're at a variable node
                if ($from.parent.type.name === 'variable') {
                    // Move cursor to after the variable
                    const pos = $from.after();
                    editor.commands.setTextSelection(pos);
                    return true;
                }
                
                return false;
            },
            'Space': ({ editor }) => {
                const { selection } = editor.state;
                const { $from } = selection;
                
                // Check if cursor is right after a variable
                const nodeBefore = $from.nodeBefore;
                if (nodeBefore && nodeBefore.type.name === 'variable') {
                    // Insert a space after the variable
                    editor.commands.insertContent(' ');
                    return true;
                }
                
                return false;
            },
        };
    },
});

function VariableComponent({ node }: any) {
    return (
        <NodeViewWrapper className="inline-block align-baseline">
            <span
                className="px-2 py-0.5 mx-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-sm text-sm font-mono border border-blue-300 dark:border-blue-700 inline-block align-baseline"
                contentEditable={false}
                style={{
                    display: 'inline-block',
                    verticalAlign: 'baseline',
                    lineHeight: 'inherit',
                }}
            >
                {`{{${node.attrs.name}}}`}
            </span>
        </NodeViewWrapper>
    );
}
