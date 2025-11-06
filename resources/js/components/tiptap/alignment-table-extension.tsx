import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        alignmentTable: {
            insertAlignmentTable: (columns?: number) => ReturnType;
            insertSignatureRow: (signatures: Array<{
                userId?: number;
                userName: string;
                position: string;
                nip?: string;
            }>) => ReturnType;
        };
    }
}

// Extension untuk tabel borderless untuk alignment
// Use case: signature positioning (1-4 signatures), list dengan titik dua aligned
export const AlignmentTable = Node.create({
  name: 'alignmentTable',

  group: 'block',

  content: 'alignmentTableRow+',

  parseHTML() {
    return [
      {
        tag: 'table[data-type="alignment-table"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'table',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'alignment-table',
        style: 'width: 100%; border-collapse: collapse; border: none; margin: 10px 0;',
      }),
      ['tbody', 0],
    ];
  },

  addCommands() {
    return {
      insertAlignmentTable: (columns = 2) => ({ commands }) => {
        const cells = [];
        for (let i = 0; i < columns; i++) {
          cells.push({
            type: 'alignmentTableCell',
            attrs: { align: i === columns - 1 ? 'right' : 'left' },
            content: [{ type: 'paragraph' }],
          });
        }
        
        return commands.insertContent({
          type: this.name,
          content: [{
            type: 'alignmentTableRow',
            content: cells,
          }],
        });
      },
      
      insertSignatureRow: (signatures) => ({ commands }) => {
        // Support 1-4 signatures
        const numSignatures = Math.min(Math.max(signatures.length, 1), 4);
        const cells = [];
        
        for (let i = 0; i < numSignatures; i++) {
          const sig = signatures[i] || { userName: '', position: '', nip: '' };
          cells.push({
            type: 'alignmentTableCell',
            attrs: { align: 'center' },
            content: [
              {
                type: 'signatureBlock',
                attrs: {
                  userId: sig.userId || null,
                  userName: sig.userName,
                  position: sig.position,
                  nip: sig.nip || null,
                },
              },
            ],
          });
        }
        
        return commands.insertContent({
          type: 'alignmentTable',
          content: [{
            type: 'alignmentTableRow',
            content: cells,
          }],
        });
      },
    };
  },
});export const AlignmentTableRow = Node.create({
  name: 'alignmentTableRow',

  content: 'alignmentTableCell+',

  parseHTML() {
    return [{ tag: 'tr' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['tr', mergeAttributes(HTMLAttributes), 0];
  },
});

export const AlignmentTableCell = Node.create({
  name: 'alignmentTableCell',

  content: 'block+',

  isolating: true,

  addAttributes() {
    return {
      align: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-align'),
        renderHTML: (attributes) => {
          return {
            'data-align': attributes.align,
            style: `text-align: ${attributes.align}; border: none; padding: 4px 8px; vertical-align: top;`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'td' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['td', mergeAttributes(HTMLAttributes), 0];
  },
});
