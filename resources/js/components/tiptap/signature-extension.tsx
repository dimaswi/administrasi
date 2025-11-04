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
        // Render as a self-closing element (no content hole needed for atom nodes)
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
            className="inline-block align-bottom"
            style={{ display: 'inline-block', margin: '0 4px' }}
        >
            <span 
                className={cn(
                    "inline-flex flex-col items-center p-2 rounded border border-gray-300 bg-white hover:border-blue-400 transition-colors",
                    "print:border-gray-300"
                )}
                style={{ fontSize: '10px' }}
                contentEditable={false}
            >
                {/* Position/Jabatan */}
                <span className="text-center mb-1 font-medium">{position}</span>
                
                {/* QR Code / Signature Placeholder */}
                <span className="border border-gray-300 bg-white h-14 w-14 flex items-center justify-center mb-1">
                    <span className="text-xs text-gray-400">QR</span>
                </span>
                
                {/* Signature Image (optional) */}
                {showSignatureImage && signatureImage && (
                    <img 
                        src={signatureImage} 
                        alt="TTD" 
                        className="h-8 w-auto object-contain mb-1"
                    />
                )}
                
                {/* Name */}
                <span className="font-semibold border-b border-black px-2 mb-0.5">
                    {userName}
                </span>
                
                {/* NIP */}
                {nip && <span className="text-[9px]">NIP. {nip}</span>}
            </span>
        </NodeViewWrapper>
    );
}
