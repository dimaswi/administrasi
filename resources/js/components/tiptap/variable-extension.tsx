import { Mark, mergeAttributes, Node } from '@tiptap/core';

// Variable as Mark (like bold/italic) - the ONLY way to not disrupt line-height
export const Variable = Mark.create({
    name: 'variable',

    addAttributes() {
        return {
            name: {
                default: null,
                parseHTML: element => element.getAttribute('data-variable'),
                renderHTML: attributes => {
                    if (!attributes.name) {
                        return {};
                    }
                    return {
                        'data-variable': attributes.name,
                    };
                },
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

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, {
            class: 'variable-placeholder',
            style: 'background-color: #dbeafe; color: #1e40af; padding: 0 3px;',
        }), 0];
    },
});

// Legacy Variable Node for backward compatibility with old templates
// This will automatically convert old Node-based variables to Mark-based
export const VariableNode = Node.create({
    name: 'variableNode',
    
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            name: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span.variable-node',
                getAttrs: (element) => {
                    if (typeof element === 'string') return false;
                    const name = element.getAttribute('data-variable');
                    return name ? { name } : false;
                },
            },
        ];
    },

    renderHTML({ node }) {
        // Atom nodes should not have content hole
        // Instead, we render the text directly as an attribute or text node
        return ['span', {
            class: 'variable-placeholder',
            'data-variable': node.attrs.name,
            'data-content': `{{${node.attrs.name}}}`,
            style: 'background-color: #dbeafe; color: #1e40af; padding: 0 3px;',
        }];
    },
});
