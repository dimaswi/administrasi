import { Extension } from '@tiptap/core';

export interface IndentOptions {
  types: string[];
  indentLevels: number[];
  defaultIndentLevel: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Set the indent level
       */
      indent: () => ReturnType;
      /**
       * Unset the indent level
       */
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
      indentLevels: [0, 30, 60, 90, 120, 150],
      defaultIndentLevel: 0,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: this.options.defaultIndentLevel,
            parseHTML: element => {
              const marginLeft = element.style.marginLeft;
              return marginLeft ? parseInt(marginLeft) : this.options.defaultIndentLevel;
            },
            renderHTML: attributes => {
              if (!attributes.indent) {
                return {};
              }

              return {
                style: `margin-left: ${attributes.indent}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch, editor }) => {
          const { selection } = state;
          tr = tr.setSelection(selection);

          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const indentLevels = this.options.indentLevels;
              
              // Find next indent level
              const nextLevel = indentLevels.find(level => level > currentIndent) || indentLevels[indentLevels.length - 1];
              
              if (nextLevel !== currentIndent) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: nextLevel,
                });
              }
            }
          });

          if (dispatch) dispatch(tr);

          return true;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr = tr.setSelection(selection);

          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const indentLevels = this.options.indentLevels;
              
              // Find previous indent level
              const reversedLevels = [...indentLevels].reverse();
              const prevLevel = reversedLevels.find(level => level < currentIndent) || 0;
              
              if (prevLevel !== currentIndent) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: prevLevel,
                });
              }
            }
          });

          if (dispatch) dispatch(tr);

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    };
  },
});
