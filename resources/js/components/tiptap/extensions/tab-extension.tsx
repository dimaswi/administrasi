import { Extension } from '@tiptap/core';

export const Tab = Extension.create({
    name: 'tab',

    addKeyboardShortcuts() {
        return {
            Tab: () => {
                // Insert actual tab character
                return this.editor.commands.insertContent('\t');
            },
            'Shift-Tab': () => {
                // Outdent - delete tab before cursor
                const { state } = this.editor;
                const { selection } = state;
                const { $from } = selection;
                const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - 1), $from.parentOffset);
                
                if (textBefore === '\t') {
                    return this.editor.commands.deleteRange({
                        from: $from.pos - 1,
                        to: $from.pos,
                    });
                }
                return true;
            },
        };
    },
});
