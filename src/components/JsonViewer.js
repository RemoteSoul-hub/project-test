import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * JsonViewer Component
 * 
 * Displays JSON data in a formatted, syntax-highlighted view with copy functionality.
 * 
 * @param {Object} props - Component props
 * @param {Object|string} props.data - JSON data to display (object or string)
 * @param {boolean} props.collapsible - Whether the JSON view should be collapsible
 * @param {boolean} props.defaultExpanded - Default expanded state if collapsible
 */
export default function JsonViewer({ data, collapsible = false, defaultExpanded = true }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Parse JSON if it's a string
  const jsonData = typeof data === 'string' ? 
    (() => {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data; // Return as is if not valid JSON
      }
    })() : data;

  // Format JSON with indentation and syntax highlighting
  const formattedJson = typeof jsonData === 'string' ? 
    jsonData : 
    JSON.stringify(jsonData, null, 2);

  // Copy JSON to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Syntax highlighting function
  const highlightSyntax = (json) => {
    if (typeof json !== 'string') return json;
    
    // Replace with HTML for syntax highlighting
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
        (match) => {
          let cls = 'text-purple-600'; // string
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'text-gray-800 font-semibold'; // key
            }
          } else if (/true|false/.test(match)) {
            cls = 'text-blue-600'; // boolean
          } else if (/null/.test(match)) {
            cls = 'text-gray-500'; // null
          } else {
            cls = 'text-green-600'; // number
          }
          return `<span class="${cls}">${match}</span>`;
        }
      );
  };

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 overflow-hidden">
      {/* Header with actions */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-100 border-b border-gray-200">
        <div className="font-medium text-gray-700">
          {collapsible ? (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="hover:text-gray-900"
            >
              {expanded ? 'Collapse' : 'Expand'} JSON
            </button>
          ) : (
            <span>JSON Data</span>
          )}
        </div>
        <button 
          onClick={copyToClipboard}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm"
        >
          {copied ? (
            <>
              <Check size={16} className="text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* JSON content */}
      {(!collapsible || expanded) && (
        <div className="overflow-auto max-h-[500px]">
          <pre 
            className="p-4 text-sm font-mono whitespace-pre overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: highlightSyntax(formattedJson) }}
          />
        </div>
      )}
    </div>
  );
}
