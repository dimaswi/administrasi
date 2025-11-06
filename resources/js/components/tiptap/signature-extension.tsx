import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { cn } from '@/lib/utils';

export interface SignatureOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        signature: {
            insertSignature: (attrs: { 
                signatureIndex?: number;
                userId?: number;
                userName: string;
                position: string; 
                nip?: string;
                placement?: 'left' | 'center' | 'right';
                showSignatureImage?: boolean;
                signatureImage?: string;
            }) => ReturnType;
        };
    }
}

export const Signature = Node.create<SignatureOptions>({
    name: 'signature',
    group: 'inline',
    inline: true,
    atom: true,
    
    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            signatureIndex: {
                default: 0,
            },
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
            placement: {
                default: 'right',
            },
            showSignatureImage: {
                default: false,
            },
            signatureImage: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="signature"]',
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
        // Render as inline span (tanpa float - user pakai TAB untuk positioning)
        const attrs = node.attrs;
        
        return [
            'span', 
            mergeAttributes(HTMLAttributes, { 
                'data-type': 'signature',
                'data-user-id': attrs.userId || '',
                'data-user-name': attrs.userName,
                'data-position': attrs.position,
                'data-nip': attrs.nip || '',
                class: 'signature-node',
            })
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SignatureComponent);
    },

    addCommands() {
        return {
            insertSignature: (attrs) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs,
                });
            },
        };
    },
});

function SignatureComponent({ node }: any) {
    const { signatureIndex, userId, userName, position, nip, showSignatureImage, signatureImage } = node.attrs;

    return (
        <NodeViewWrapper 
            as="span"
            style={{ display: 'inline-block', verticalAlign: 'top', margin: '0 8px', minWidth: '180px', textAlign: 'center' }}
        >
            <span 
                style={{ 
                    display: 'inline-flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '12px', 
                    background: 'white', 
                    fontSize: '11pt' 
                }}
                contentEditable={false}
            >
                {/* Position/Jabatan */}
                <span style={{ display: 'block', textAlign: 'center', marginBottom: '8px', fontWeight: 500, fontSize: '11pt' }}>{position}</span>
                
                {/* QR Code / Signature Placeholder - ukuran lebih besar - TANPA BORDER */}
                <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: 'white', 
                    width: '80px', 
                    height: '80px', 
                    marginBottom: '8px', 
                    fontSize: '10pt', 
                    color: '#9ca3af' 
                }}>
                    QR
                </span>
                
                {/* Signature Image (optional) */}
                {showSignatureImage && signatureImage && (
                    <img 
                        src={signatureImage} 
                        alt="TTD" 
                        style={{ height: '40px', width: 'auto', objectFit: 'contain', marginBottom: '8px', display: 'block' }}
                    />
                )}
                
                {/* Name */}
                <span style={{ display: 'inline-block', fontWeight: 600, borderBottom: '1px solid #000', padding: '0 12px', marginBottom: '4px', fontSize: '11pt' }}>
                    {userName}
                </span>
                
                {/* NIP */}
                {nip && <span style={{ display: 'block', fontSize: '9pt' }}>NIP. {nip}</span>}
            </span>
        </NodeViewWrapper>
    );
}
