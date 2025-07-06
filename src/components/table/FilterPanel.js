'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const margin = 8; // Define margin at component scope

/**
 * FilterPanel Component
 *
 * A dynamic filter panel that allows filtering by custom fields.
 * Displays as a dropdown under the filter button rather than a centered modal.
 * Filters are only applied when the user clicks the Apply button.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the filter panel is open
 * @param {Function} props.onClose - Function to call when closing the panel
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onApplyFilters - Function to call when filters are applied
 * @param {Object} props.buttonRef - Reference to the filter button element
 * @param {Array} props.filterFields - Array of filter field definitions
 */
export default function FilterPanel({
  isOpen,
  onClose,
  filters = {},
  onApplyFilters,
  buttonRef,
  filterFields = []
}) {
  // Initialize state with current filters
  const [filterValues, setFilterValues] = useState(filters);
  const [openDropdown, setOpenDropdown] = useState(null);
  // Initialize position state to include left, maxWidth, and maxHeight
  const [position, setPosition] = useState({ top: 0, left: 0, maxWidth: undefined, maxHeight: undefined });
  
  const panelRef = useRef(null);
  
  // Calculate position based on button position
  useEffect(() => {
    if (isOpen && buttonRef?.current && panelRef?.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Horizontal positioning (viewport-relative)
      let newLeft = buttonRect.left + (buttonRect.width / 2) - (panelRect.width / 2);
      newLeft = Math.max(margin, newLeft); // Ensure not off-left of viewport + margin
      // Check if panel overflows right edge of viewport
      if (newLeft + panelRect.width + margin > viewportWidth) {
        newLeft = viewportWidth - panelRect.width - margin; // Align to right edge of viewport - margin
      }
      newLeft = Math.max(margin, newLeft); // Re-clamp to left edge if needed after right adjustment

      // Vertical positioning (viewport-relative)
      let newTop = buttonRect.bottom + margin; // Default below button

      // Check if it fits below (within viewportHeight)
      if (newTop + panelRect.height + margin > viewportHeight) {
        // Doesn't fit below. Try above.
        const topAbove = buttonRect.top - panelRect.height - margin;
        if (topAbove >= margin) { // Check if it fits above (with margin from viewport top)
          newTop = topAbove;
        } else {
          // Doesn't fit well above either. Position at top of viewport with margin.
          newTop = margin;
        }
      }
      // Ensure newTop is not less than margin (e.g. if button is at the very top and panel is placed above, or panel is very tall)
      newTop = Math.max(margin, newTop);
      
      const newMaxWidth = viewportWidth - (2 * margin);

      // Calculate maxHeight (all viewport-relative)
      // newTop is the viewport-relative top of the panel.
      // Max height is from newTop to (viewportHeight - margin_for_bottom_spacing).
      let newMaxHeight = viewportHeight - newTop - margin;
      if (newMaxHeight < 50) { // Ensure a minimum height for the panel, e.g., 50px
        newMaxHeight = 50;
      }


      setPosition({
        top: newTop,
        left: newLeft,
        maxWidth: newMaxWidth,
        maxHeight: newMaxHeight 
      });
    }
  }, [isOpen, buttonRef, filterFields, panelRef]); // Dependencies include panelRef as its dimensions are used
  
  // Handle outside click for the entire panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close the entire panel if clicking outside of it and not on the button
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target) && 
        buttonRef?.current && 
        !buttonRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, buttonRef]);
  
  // Apply filters
  const handleApplyFilters = () => {
    onApplyFilters(filterValues);
    onClose(); // Close the panel after applying filters
  };
  
  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {};
    filterFields.forEach(field => {
      clearedFilters[field.name] = '';
    });
    setFilterValues(clearedFilters);
    
    // Apply the cleared filters immediately and close the panel
    onApplyFilters(clearedFilters);
    onClose();
  };
  
  // Reset filters to their initial values when the panel opens
  useEffect(() => {
    if (isOpen) {
      setFilterValues(filters);
    }
  }, [isOpen, filters]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={panelRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg w-full sm:w-auto border border-gray-300 sm:border-0" // Responsive width & conditional border
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        maxWidth: position.maxWidth ? `${position.maxWidth}px` : '380px',
        maxHeight: position.maxHeight ? `${position.maxHeight}px` : 'auto', // Use maxHeight from state
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b">
        <h2 className="text-base font-medium">Filters</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
          aria-label="Close filters"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Filter content */}
      <div className="p-3">
        {/* Filter fields - using grid for two columns */}
        <div className="grid grid-cols-2 gap-x-4"> 
          {filterFields.map((field) => (
            <div key={field.name} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">{field.label}</label>
              <button
                onClick={() => {
                  // Update local state
                  const updatedFilters = {
                    ...filterValues,
                    [field.name]: ''
                  };
                  setFilterValues(updatedFilters);
                  
                  // Apply the updated filters immediately
                  onApplyFilters(updatedFilters);
                  onClose();
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
            
            {field.type === 'select' ? (
              <div className="relative">
                <button
                  type="button"
                  className="w-full flex justify-between items-center px-3 py-1.5 border rounded-md bg-white text-sm"
                  onClick={() => setOpenDropdown(openDropdown === field.name ? null : field.name)}
                >
                  <span>{filterValues[field.name] || field.placeholder || 'Select'}</span>
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {openDropdown === field.name && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 max-h-48 overflow-auto">
                    {field.options.map((option) => (
                      <button
                        key={option.value}
                        className={`w-full text-left px-4 py-1.5 hover:bg-gray-100 text-sm ${filterValues[field.name] === option.value ? 'bg-gray-50' : ''}`}
                        onClick={() => {
                          // Update local state
                          const updatedFilters = {
                            ...filterValues,
                            [field.name]: option.value
                          };
                          setFilterValues(updatedFilters);
                          setOpenDropdown(null);
                          
                          // Apply the updated filters immediately
                          onApplyFilters(updatedFilters);
                          onClose();
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <input
                type={field.type || 'text'}
                placeholder={field.placeholder || ''}
                value={filterValues[field.name] || ''}
                onChange={(e) => {
                  setFilterValues(prev => ({
                    ...prev,
                    [field.name]: e.target.value
                  }));
                }}
                // Apply filter on blur (when user finishes typing)
                onBlur={() => {
                  onApplyFilters(filterValues);
                }}
                className="w-full px-3 py-1.5 border rounded-md text-sm"
              />
            )}
            </div>
          ))}
        </div>
        
        {/* Apply button */}
        {/* Action buttons */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md text-sm"
          >
            Clear All
          </button>
          <button
            onClick={handleApplyFilters}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
