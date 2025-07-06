'use client'
import { useEffect, useRef, useState } from 'react'; // Import useState
import { X } from 'lucide-react';

/**
 * Reusable Modal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when the modal is closed
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.size - Modal size (sm, md, lg, xl)
 * @param {boolean} props.closeOnClickOutside - Whether to close modal on outside click (defaults to true)
 * @param {boolean} [props.showTitleSeparator] - Whether to show a separator line below the title (defaults to false)
 * @param {boolean} [props.confirmOnClose] - Whether to show a confirmation dialog before closing (defaults to false)
 * @param {boolean} [props.showBackdrop] - Whether to show the background overlay (defaults to true)
 */
export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  closeOnClickOutside = true,
  showTitleSeparator = false,
  confirmOnClose = false,
  showBackdrop = true // Add new prop with default value
}) {
  const modalRef = useRef(null);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  const handleAttemptClose = () => {
    if (confirmOnClose) {
      setIsConfirmingClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    onClose();
    setIsConfirmingClose(false);
  };

  const handleCancelClose = () => {
    setIsConfirmingClose(false);
  };
  
  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isConfirmingClose) {
          handleCancelClose(); // Close confirmation dialog on ESC
        } else {
          handleAttemptClose();
        }
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto'; // Ensure overflow is reset
    };
  }, [isOpen, onClose, confirmOnClose, isConfirmingClose]); // Added dependencies
  
  // Handle click outside modal to close
  const handleOutsideClick = (e) => {
    if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(e.target) && !isConfirmingClose) {
      handleAttemptClose();
    }
  };
  
  if (!isOpen) return null;
  
  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full'
  };
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 ${showBackdrop ? 'bg-black bg-opacity-50' : ''}`}
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col relative border border-gray-200`} // Added border and border-gray-200
        onClick={(e) => e.stopPropagation()}
      >
        {isConfirmingClose && (
          <div className="absolute inset-0 z-10 bg-white bg-opacity-90 flex flex-col items-center justify-center p-4 md:p-6 rounded-lg">
            <p className="text-lg font-medium mb-4 text-center">Are you sure you want to close?</p>
            <div className="flex gap-4">
              <button
                onClick={handleConfirmClose}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Yes, Close
              </button>
              <button
                onClick={handleCancelClose}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                No, Keep Open
              </button>
            </div>
          </div>
        )}

        {/* Modal header */}
        {title ? (
          <>
            <div className="flex justify-between items-center p-3 md:p-4 border-b">
              <h2 className="text-xl font-semibold">{title}</h2>
              <button 
                onClick={handleAttemptClose}
                className="text-gray-500 hover:text-gray-700 p-1"
                aria-label="Close modal"
                disabled={isConfirmingClose} // Disable while confirming
              >
                <X size={28} />
              </button>
            </div>
            {showTitleSeparator && <hr className="border-gray-200" />}
          </>
        ) : (
          // No title: just the close button, positioned top-right with minimal padding
          <div className="flex justify-end p-2"> 
            <button 
              onClick={handleAttemptClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="Close modal"
              disabled={isConfirmingClose} // Disable while confirming
            >
              <X size={28} />
            </button>
          </div>
        )}
        
        {/* Modal content */}
        <div className={`p-3 md:p-4 overflow-y-auto flex-grow ${isConfirmingClose ? 'opacity-50' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
