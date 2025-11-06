import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';

// Letterhead Node Extension
export const Letterhead = Node.create({
    name: 'letterhead',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            logo: {
                default: null,
            },
            logoWidth: {
                default: 200, // default width in pixels
            },
            logoHeight: {
                default: 128, // default height in pixels (max-h-32 = 128px)
            },
            fullWidth: {
                default: false, // if true, logo spans full width
            },
            align: {
                default: 'center', // left, center, right
            },
            organization: {
                default: '',
            },
            address: {
                default: '',
            },
            phone: {
                default: '',
            },
            email: {
                default: '',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-letterhead]',
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-letterhead': 'true',
                'class': 'letterhead',
            }),
            [
                'div',
                { class: 'text-center border-b-2 border-gray-800 pb-3 mb-4' },
                [
                    'div',
                    { class: 'space-y-2' },
                    node.attrs.logo && ['img', { src: node.attrs.logo, class: 'h-16 mx-auto' }],
                    ['h2', { class: 'text-xl font-bold uppercase' }, node.attrs.organization],
                    ['p', { class: 'text-sm' }, node.attrs.address],
                    (node.attrs.phone || node.attrs.email) && [
                        'p',
                        { class: 'text-sm' },
                        [
                            node.attrs.phone && `Telp: ${node.attrs.phone}`,
                            node.attrs.phone && node.attrs.email && ' | ',
                            node.attrs.email && `Email: ${node.attrs.email}`,
                        ].filter(Boolean).join(''),
                    ],
                ].filter(Boolean),
            ],
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(LetterheadComponent);
    },
});

function LetterheadComponent({ node, updateAttributes }: any) {
    const alignClass = 
        node.attrs.align === 'left' ? 'text-left' :
        node.attrs.align === 'right' ? 'text-right' :
        'text-center';
    
    const flexAlign = 
        node.attrs.align === 'left' ? 'justify-start' :
        node.attrs.align === 'right' ? 'justify-end' :
        'justify-center';

    const isFullWidth = node.attrs.fullWidth;

    return (
        <NodeViewWrapper>
            {/* Container untuk kop surat - ukuran presisi 700x147px */}
            <div
                className="letterhead bg-white"
                contentEditable={false}
                style={{
                    margin: '0 0 12pt 0',
                    padding: 0,
                    width: '700px',
                    maxWidth: '100%',
                }}
            >
                {node.attrs.logo && (
                    isFullWidth ? (
                        // Full width: kop surat 700px x 147px
                        <img 
                            src={node.attrs.logo} 
                            alt="Logo Kop Surat" 
                            style={{ 
                                width: '700px',
                                height: '147px',
                                maxWidth: '100%',
                                objectFit: 'contain',
                                display: 'block',
                                margin: 0,
                                padding: 0,
                            }}
                        />
                    ) : (
                        // Normal mode with alignment
                        <div className={`flex ${flexAlign} w-full py-4`} style={{ paddingLeft: '20mm', paddingRight: '20mm' }}>
                            <img 
                                src={node.attrs.logo} 
                                alt="Logo Kop Surat" 
                                style={{ 
                                    width: `${node.attrs.logoWidth}px`,
                                    height: `${node.attrs.logoHeight}px`,
                                    objectFit: 'contain',
                                    maxWidth: '100%'
                                }}
                            />
                        </div>
                    )
                )}
                
                {/* Text content - only show if not full width or if there's text */}
                {(node.attrs.organization || node.attrs.address || node.attrs.phone || node.attrs.email) && (
                    <div className={`space-y-2 ${alignClass} py-4`} style={{ paddingLeft: '20mm', paddingRight: '20mm' }}>
                        {node.attrs.organization && (
                            <h2 className="text-xl font-bold uppercase">{node.attrs.organization}</h2>
                        )}
                        {node.attrs.address && <p className="text-sm">{node.attrs.address}</p>}
                        {(node.attrs.phone || node.attrs.email) && (
                            <p className="text-sm">
                                {node.attrs.phone && `Telp: ${node.attrs.phone}`}
                                {node.attrs.phone && node.attrs.email && ' | '}
                                {node.attrs.email && `Email: ${node.attrs.email}`}
                            </p>
                        )}
                    </div>
                )}
                
                <div className="text-xs text-blue-600 dark:text-blue-400 text-center pb-2 border-t border-dashed border-blue-200 dark:border-blue-800 pt-2" style={{ marginLeft: '20mm', marginRight: '20mm' }}>
                    📝 Klik button "Kop Surat" untuk mengubah
                </div>
            </div>
        </NodeViewWrapper>
    );
}
