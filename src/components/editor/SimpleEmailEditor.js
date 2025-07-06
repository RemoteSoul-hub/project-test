'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { 
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, Link as LinkIcon, Unlink, Undo, Redo,
  Code, Save, Send, X, Globe
} from 'lucide-react'; // Added Globe icon

const languages = [
  { name: 'English', value: 'en' },
  { name: 'Spanish', value: 'es' },
  { name: 'Portuguese', value: 'pt' },
  { name: 'German', value: 'de' },
  { name: 'French', value: 'fr' },
  { name: 'Italian', value: 'it' },
  { name: 'Japanese', value: 'ja' },
  { name: 'Chinese', value: 'zh' },
  { name: 'Korean', value: 'ko' },
];

const MenuBar = ({ editor, isHtmlMode, onToggleHtml }) => {
  if (!editor) {
    return null;
  }

  const canUseEditorFeatures = !!editor;

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50 p-2 flex items-center flex-wrap gap-1">
      {canUseEditorFeatures && !isHtmlMode && (
        <>
          <select 
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'p') {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(value.replace('h', '')) }).run();
              }
            }}
            className="h-8 px-2 rounded border border-gray-300 bg-white text-sm"
            value={
              editor.isActive('heading', { level: 1 }) ? 'h1' :
              editor.isActive('heading', { level: 2 }) ? 'h2' :
              'p'
            }
            disabled={!canUseEditorFeatures}
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
          </select>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
            disabled={!canUseEditorFeatures}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
            disabled={!canUseEditorFeatures}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
            disabled={!canUseEditorFeatures}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
            disabled={!canUseEditorFeatures}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
            disabled={!canUseEditorFeatures}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
            disabled={!canUseEditorFeatures}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
            disabled={!canUseEditorFeatures}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
            disabled={!canUseEditorFeatures}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={addLink}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
            disabled={!canUseEditorFeatures}
            title="Add Link"
          >
            <LinkIcon size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive('link') || !canUseEditorFeatures}
            className="p-1.5 rounded hover:bg-gray-200"
            title="Remove Link"
          >
            <Unlink size={16} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo() || !canUseEditorFeatures}
            className="p-1.5 rounded hover:bg-gray-200"
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo() || !canUseEditorFeatures}
            className="p-1.5 rounded hover:bg-gray-200"
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </>
      )}

      {canUseEditorFeatures && <div className="w-px h-6 bg-gray-300 mx-1" />}
      
      <button
        onClick={onToggleHtml}
        className={`p-1.5 rounded hover:bg-gray-200 ${isHtmlMode ? 'bg-gray-200' : ''}`}
        disabled={!canUseEditorFeatures}
        title="Toggle HTML Source"
      >
        <Code size={16} />
      </button>
    </div>
  );
};

export default function SimpleEmailEditor({
  content,
  onChange,
  onOverwriteTemplate,
  onUpdateTemplate,
  onRevertTemplate,
  isOverridden,
  enableSaveActions,
  showRevertConfirmationButtons,
  onCancelRevert,
  onConfirmRevert,
  isLoading,
  showBusyOverlay     // New prop to show loading overlay
}) {
  const [mounted, setMounted] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  // Removed hasChanges and originalContent state, as this is now managed by the parent

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlContent(html);
      onChange(html);
    },
    parseOptions: {
      preserveWhitespace: true,
    },
    editorProps: {
      attributes: {
        class: 'email-content focus:outline-none',
      },
    },
    immediatelyRender: false, // Added to address SSR hydration issues
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setHtmlContent(content);
      // Original content comparison is now handled by the parent component
    }
  }, [content, editor]);

  // Removed useEffect for hasChanges, as enableSaveActions prop controls this

  const handleHtmlChange = (e) => {
    const newHtml = e.target.value;
    setHtmlContent(newHtml);
    if (editor) {
      editor.commands.setContent(newHtml);
    }
    onChange(newHtml);
  };

  if (!mounted) {
    return <div className="border rounded-md p-4 bg-gray-50">Loading editor...</div>;
  }

  return (
    <div className="email-editor border rounded-md overflow-hidden flex flex-col relative"> {/* Added position: relative */}
      {/* Loading Overlay */}
      {showBusyOverlay && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <MenuBar 
        editor={editor} 
        isHtmlMode={isHtmlMode} 
        onToggleHtml={() => setIsHtmlMode(!isHtmlMode)}
      />
      <div className="bg-white flex-grow">
        {isHtmlMode ? (
          <textarea
            value={htmlContent}
            onChange={handleHtmlChange}
            className="w-full min-h-[300px] p-4 font-mono text-sm focus:outline-none"
            spellCheck="false"
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
      <div className="border-t border-gray-200 bg-gray-50 p-3 flex flex-col"> {/* Changed to flex-col and p-3 for spacing */}
        {isOverridden && (
          <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded-md mb-2 text-center">
            You are editing an overridden version of this template for the selected language.
          </div>
        )}
        <div className="flex items-center justify-end space-x-2"> {/* Original button row */}
          {isOverridden ? (
            <>
              <button
              onClick={onUpdateTemplate}
              disabled={!enableSaveActions}
              className={`px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1.5 text-sm ${!enableSaveActions ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Update Overridden Template"
            >
              <Save size={16} />
              Update Template
            </button>
            {/* Conditional Revert / Confirmation Buttons */}
            {showRevertConfirmationButtons ? (
              <>
                <span className="text-sm text-red-600 self-center mr-2">Are you sure?</span>
                <button
                  onClick={onCancelRevert}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  disabled={isLoading} // Also disable cancel during loading
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirmRevert}
                  disabled={isLoading}
                  className={`px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Reverting...' : 'Confirm Revert'}
                </button>
              </>
            ) : (
              <button
                onClick={onRevertTemplate}
                className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1.5 text-sm"
                title="Revert to Default Template"
                disabled={isLoading} // Disable revert button if any action is loading
              >
                 {/* Using X icon from lucide-react would require importing it */}
                 {/* <X size={16} /> */}
                 Revert to Default
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onOverwriteTemplate}
            disabled={!enableSaveActions}
            className={`px-3 py-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center gap-1.5 text-sm ${!enableSaveActions ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Override Default Template"
          >
            <Save size={16} />
            Override Template
          </button>
        )}
        </div> {/* Closing the div for button row */}
      </div>
      <style jsx global>{`
        .email-editor {
          min-height: 400px;
        }
        .email-editor .email-content {
          min-height: 300px;
          padding: 1rem;
        }
        .email-editor .email-content > * {
          margin: 0;
        }
        .email-editor .email-content > * + * {
          margin-top: 0.5em;
        }
        .email-editor .email-content ul,
        .email-editor .email-content ol {
          padding-left: 1.5rem;
          margin: 0;
        }
        .email-editor .email-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .email-editor .email-content h1 {
          font-size: 1.5em;
          font-weight: 600;
        }
        .email-editor .email-content h2 {
          font-size: 1.25em;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
