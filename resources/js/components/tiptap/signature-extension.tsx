import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export interface SignatureOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        signature: {
            insertSignature: (attrs: { 
                userId: number;
                userName: string;
                position: string; 
                nip?: string;
                showSignatureImage?: boolean;
                signatureImage?: string;
            }) => ReturnType;
        };
    }
}

export const Signature = Node.create<SignatureOptions>({
    name: 'signature',
    group: 'block',
    draggable: true,

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
                tag: 'div[data-type="signature"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'signature' }), 0];
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
    const { userId, userName, position, nip, showSignatureImage, signatureImage } = node.attrs;

    return (
        <NodeViewWrapper className="signature-wrapper my-8" data-drag-handle>
            <div className={cn(
                "flex justify-end cursor-move hover:bg-blue-50 p-2 rounded transition-colors",
                "print:hover:bg-transparent print:cursor-default"
            )}>
                <div className="text-center min-w-[200px] max-w-[250px]">
                    {/* Position/Jabatan */}
                    <p className="mb-3 font-medium">{position}</p>
                    
                    {/* QR Code di tengah */}
                    <div className="flex justify-center mb-3">
                        <div className="border-2 border-gray-300 p-2 bg-white">
                            <QRCodeSVG 
                                value={`USER:${userId}|NAME:${userName}|NIP:${nip || 'N/A'}`}
                                size={100}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                    </div>
                    
                    {/* Signature Image (optional) */}
                    {showSignatureImage && signatureImage && (
                        <div className="my-2 flex justify-center">
                            <img 
                                src={signatureImage} 
                                alt="Tanda Tangan" 
                                className="h-16 w-auto object-contain"
                            />
                        </div>
                    )}
                    
                    {/* Name */}
                    <p className="font-semibold border-b border-black inline-block px-4 pb-1">
                        {userName}
                    </p>
                    
                    {/* NIP */}
                    {nip && <p className="text-sm mt-1">NIP. {nip}</p>}
                </div>
            </div>
            <div className="text-xs text-muted-foreground text-center mt-1 print:hidden">
                ✋ Drag untuk memindahkan posisi
            </div>
        </NodeViewWrapper>
    );
}
