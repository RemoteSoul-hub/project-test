import { Download, ChevronDown, FileText, Table } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

/**
 * Responsive Download Button Component with Dropdown
 * 
 * This component renders a button that triggers download functionality with a dropdown menu.
 * It adapts to different screen sizes with responsive styling.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onDownloadXLSX - Function called when XLSX download is clicked
 * @param {Function} props.onDownloadCSV - Function called when CSV download is clicked
 */
export default function DownloadButton({ onDownloadXLSX, onDownloadCSV }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1 border px-2 sm:px-3 py-2 rounded-md text-sm whitespace-nowrap hover:bg-gray-50"
        aria-label="Download options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Download size={16} />
        <span className="hidden sm:inline">Download</span>
        <ChevronDown size={14} className="ml-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border">
          <button
            onClick={() => {
              onDownloadXLSX();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
          >
            <FileText size={16} className="mr-2" />
            <span>Download XLSX</span>
          </button>
          <button
            onClick={() => {
              onDownloadCSV();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
          >
            <Table size={16} className="mr-2" />
            <span>Download CSV</span>
          </button>
        </div>
      )}
    </div>
  );
} 