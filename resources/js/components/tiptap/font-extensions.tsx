import { Extension } from '@tiptap/core';

// Font Size Extension
export const FontSize = Extension.create({
    name: 'fontSize',

    addOptions() {
        return {
            types: ['textStyle'],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element) => element.style.fontSize.replace('px', ''),
                        renderHTML: (attributes) => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}px`,
                            };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setFontSize:
                (fontSize: string) =>
                ({ chain }) => {
                    return chain().setMark('textStyle', { fontSize }).run();
                },
            unsetFontSize:
                () =>
                ({ chain }) => {
                    return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
                },
        };
    },
});

// Line Height Extension
export const LineHeight = Extension.create({
    name: 'lineHeight',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            defaultLineHeight: 'normal',
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineHeight: {
                        default: this.options.defaultLineHeight,
                        parseHTML: (element) => element.style.lineHeight || this.options.defaultLineHeight,
                        renderHTML: (attributes) => {
                            if (attributes.lineHeight === this.options.defaultLineHeight) {
                                return {};
                            }
                            return {
                                style: `line-height: ${attributes.lineHeight}`,
                            };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setLineHeight:
                (lineHeight: string) =>
                ({ commands }) => {
                    return this.options.types.every((type: string) =>
                        commands.updateAttributes(type, { lineHeight })
                    );
                },
            unsetLineHeight:
                () =>
                ({ commands }) => {
                    return this.options.types.every((type: string) =>
                        commands.resetAttributes(type, 'lineHeight')
                    );
                },
        };
    },
});
