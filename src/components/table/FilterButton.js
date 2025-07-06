import { Filter } from 'lucide-react';

/**
 * Responsive Filter Button Component
 * 
 * This component renders a button that triggers filter functionality.
 * It adapts to different screen sizes with responsive styling.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Function called when the button is clicked
 * @param {boolean} props.isActive - Whether filters are currently active
 * @param {Object} props.buttonRef - Reference to the button element
 */
export default function FilterButton({ onClick, isActive = false, buttonRef }) {
  return (
    <button 
      ref={buttonRef}
      onClick={onClick} 
      className={`flex items-center justify-center gap-1 border px-2 sm:px-3 py-2 rounded-md text-sm whitespace-nowrap ${
        isActive ? 'bg-blue-50 border-blue-200 text-blue-600' : ''
      }`}
      aria-label="Filter results"
    >
      <Filter size={16} />
      <span className="hidden sm:inline">Filters</span>
      {isActive && <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 sm:ml-1"></span>}
    </button>
  );
}
