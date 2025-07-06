'use client';

import { useRef, useEffect } from 'react';
import Editor from 'react-simple-wysiwyg';

export default function EmailEditor({
  content,
  onChange,
  height = 700,
  missingTags = [],
  showValidation = true
}) {
  const containerRef = useRef(null);
  const isResizing = useRef(false);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const startResize = (e) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = e.clientY - containerRect.top;
    
    if (newHeight >= 700) {
      setEditorHeight(newHeight);
    }
  };

  const stopResize = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResize);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResize);
    };
  }, []);

  return (
    <div className="container mx-auto p-2 md:p-4">
      <div
        className="border rounded p-2 md:p-4 bg-white shadow relative"
        ref={containerRef}
      >
        <Editor
          value={content}
          onChange={handleChange}
          containerProps={{
            className: 'border border-gray-200 rounded p-1.5 md:p-3',
            style: { height: `${height}px`, minHeight: '700px' }
          }}
        />
        {showValidation && missingTags.length > 0 && (
          <div className="mt-2 text-sm text-red-600">
            Missing required tags: {missingTags.map(t => `{${t}}`).join(', ')}
          </div>
        )}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 bg-gray-100 hover:bg-blue-200 cursor-ns-resize"
          onMouseDown={startResize}
        />
      </div>
    </div>
  );
}
