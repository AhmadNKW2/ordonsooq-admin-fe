import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, List, ListOrdered } from 'lucide-react';
import { FieldWrapper } from './field-wrapper';

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    label?: string;
    error?: string | boolean;
    isRtl?: boolean;
    placeholder?: string;
    className?: string;
}

const ToolbarButton = ({ 
    onClick, 
    isActive, 
    children 
}: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode 
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`p-1.5 rounded-sm transition-colors ${
            isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
        {children}
    </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    label,
    error,
    isRtl = false,
    placeholder,
    className = '',
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder || ' ',
            }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
        editorProps: {
            attributes: {
                class: `prose prose-sm max-w-none focus:outline-none min-h-[100px] px-4 py-3 ${
                    isRtl ? 'text-right' : 'text-left'
                }`,
                dir: isRtl ? 'rtl' : 'ltr',
            },
        },
    });

    // Update editor content when value prop changes externally
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            // Only update if the content is different to avoid cursor jumping
             // Simple check, for complex cases might need more robust comparison
            if (editor.getText() === '' && !value) return; 
            
            // If the values are drastically different, we might want to set content
            // But usually for controlled inputs we rely on the editor state
            // Let's just set it if completely different.
            if (value === undefined || value === null) {
                if (editor.getHTML() !== '<p></p>') {
                    editor.commands.setContent('');
                }
            } else if (value !== editor.getHTML()) {
                 editor.commands.setContent(value);
            }
        }
    }, [value, editor]);

    const hasValue = Boolean(value && value !== '<p></p>');
    
    // We need to style the container to look like an input
    // The FieldWrapper handles the label positioning.
    // We need to pass the border classes to the container of the editor.
    
    const borderColor = error ? 'border-danger' : isFocused ? 'border-primary' : 'border-primary/20';

    if (!editor) {
        return null;
    }

    return (
        <FieldWrapper
            label={label}
            error={error}
            isFocused={isFocused || editor.isFocused}
            hasValue={hasValue}
            isRtl={isRtl}
            isClearButton={false} // Complex to clear rich text via simple button
            className={className}
        >
            <div className={`w-full rounded-lg border bg-white overflow-hidden transition-colors ${borderColor}`}>
                {/* Toolbar */}
                <div className="flex items-center gap-1 border-b border-gray-100 px-2 py-1 bg-gray-50/50">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                    >
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                    >
                        <List className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                {/* Editor Area */}
                <EditorContent editor={editor} className={`${isRtl ? 'rtl' : 'ltr'}`} />
                
                <style jsx global>{`
                    .ProseMirror p.is-editor-empty:first-child::before {
                        color: #adb5bd;
                        content: attr(data-placeholder);
                        float: ${isRtl ? 'right' : 'left'};
                        height: 0;
                        pointer-events: none;
                    }
                    .ProseMirror ul {
                        list-style-type: disc;
                        padding-${isRtl ? 'right' : 'left'}: 1.5rem;
                        margin: 0.5rem 0;
                    }
                    .ProseMirror ol {
                        list-style-type: decimal;
                        padding-${isRtl ? 'right' : 'left'}: 1.5rem;
                        margin: 0.5rem 0;
                    }
                    .ProseMirror strong {
                        font-weight: bold;
                    }
                `}</style>
            </div>
        </FieldWrapper>
    );
};
