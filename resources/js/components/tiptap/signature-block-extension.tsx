import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

export interface SignatureBlockOptions {
    HTMLAttributes: Record<string, any>;
}

// SignatureBlock - digunakan di dalam alignmentTableCell untuk tanda tangan
export const SignatureBlock = Node.create<SignatureBlockOptions>({
    name: 'signatureBlock',
    
    group: 'block',
    
    atom: true,
    
    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            userId: {
                default: null,
            },
            userName: {
                default: 'Nama Penandatangan',
            },
            position: {
                default: 'Jabatan',
            },
            nip: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="signature-block"]',
                getAttrs: (dom) => {
                    if (typeof dom === 'string') return {};
                    const element = dom as HTMLElement;
                    return {
                        userId: element.getAttribute('data-user-id') ? parseInt(element.getAttribute('data-user-id')!) : null,
                        userName: element.getAttribute('data-user-name') || 'Nama Penandatangan',
                        position: element.getAttribute('data-position') || 'Jabatan',
                        nip: element.getAttribute('data-nip') || null,
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes, node }) {
        const attrs = node.attrs;
        
        return [
            'div', 
            mergeAttributes(HTMLAttributes, { 
                'data-type': 'signature-block',
                'data-user-id': attrs.userId || '',
                'data-user-name': attrs.userName,
                'data-position': attrs.position,
                'data-nip': attrs.nip || '',
                class: 'signature-block',
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SignatureBlockComponent);
    },
});

function SignatureBlockComponent({ node }: any) {
    const { userId, userName, position, nip } = node.attrs;

    return (
        <NodeViewWrapper 
            as="div"
            style={{ display: 'block', textAlign: 'center', padding: '8px' }}
        >
            <div 
                style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    fontSize: '11pt' 
                }}
                contentEditable={false}
            >
                {/* Position/Jabatan */}
                <div style={{ marginBottom: '8px', fontWeight: 500 }}>{position}</div>
                
                {/* QR Code Placeholder - 80px untuk konsistensi */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: 'white', 
                    border: '1px dashed #ccc',
                    width: '80px', 
                    height: '80px', 
                    marginBottom: '8px', 
                    fontSize: '10pt', 
                    color: '#9ca3af' 
                }}>
                    QR
                </div>
                
                {/* Name dengan underline */}
                <div style={{ 
                    fontWeight: 600, 
                    borderBottom: '1px solid #000', 
                    padding: '0 12px', 
                    marginBottom: '4px' 
                }}>
                    {userName}
                </div>
                
                {/* NIP */}
                {nip && <div style={{ fontSize: '9pt' }}>NIP. {nip}</div>}
            </div>
        </NodeViewWrapper>
    );
}
