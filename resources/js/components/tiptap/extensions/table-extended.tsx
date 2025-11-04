import { Table } from '@tiptap/extension-table';
import { mergeAttributes } from '@tiptap/core';

export const TableExtended = Table.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            class: {
                default: null,
                parseHTML: (element) => {
                    return element.getAttribute('class');
                },
                renderHTML: (attributes) => {
                    if (!attributes.class) {
                        return {};
                    }
                    return {
                        class: attributes.class,
                    };
                },
            },
        };
    },

    renderHTML({ HTMLAttributes }) {
        return ['table', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ['tbody', 0]];
    },
});
