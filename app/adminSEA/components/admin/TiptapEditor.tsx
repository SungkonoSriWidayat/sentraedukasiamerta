'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Komponen untuk menampilkan toolbar editor
const EditorToolbar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-300 p-1 rounded' : 'p-1 rounded hover:bg-gray-200'}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-gray-300 p-1 rounded' : 'p-1 rounded hover:bg-gray-200'}
      >
        Italic
      </button>
       <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={editor.isActive('paragraph') ? 'bg-gray-300 p-1 rounded' : 'p-1 rounded hover:bg-gray-200'}
      >
        Paragraph
      </button>
    </div>
  );
};


// Komponen utama editor
interface TiptapEditorProps {
    content: string;
    onChange: (richText: string) => void;
}

const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const editor = useEditor({
    immediatelyRender: false, // <-- INI PERBAIKANNYA
    extensions: [
      StarterKit.configure({
        heading: false,
        strike: false,
        bulletList: false,
        orderedList: false,
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none border border-gray-300 rounded-b-lg p-4 min-h-[150px]',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div>
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;