'use client'
import { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * NotificationModal Component
 * 
 * A simple notification modal that auto-closes after a specified duration
 * and can display different types of messages (success, error, info)
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the notification is open
 * @param {function} props.onClose - Function to call when the notification is closed
 * @param {string} props.message - The message to display
 * @param {string} props.type - The type of notification (success, error, info)
 * @param {number} props.duration - Duration in milliseconds before auto-close (default: 3000ms)
 */
export default function NotificationModal({ 
  isOpen, 
  onClose, 
  message, 
  type = 'success', 
  duration = 3000 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const timerRef = useRef(null);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Set up auto-close timer when notification opens
  useEffect(() => {
    if (isOpen) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, duration);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isOpen, onClose, duration]);
  
  // Handle ESC key press to close notification
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen || !isMounted) return null;
  
  // Determine icon and colors based on notification type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="text-green-500" size={20} />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500'
        };
      case 'error':
        return {
          icon: <AlertCircle className="text-red-500" size={20} />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500'
        };
      case 'info':
      default:
        return {
          icon: <Info className="text-blue-500" size={20} />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-500'
        };
    }
  };
  
  const { icon, bgColor, borderColor } = getTypeStyles();
  
  return createPortal(
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div 
        className={`${bgColor} border-l-4 ${borderColor} p-4 rounded shadow-md max-w-md flex items-start`}
        role="alert"
      >
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
        <div className="flex-grow mr-3">
          <p className="text-sm">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 flex-shrink-0"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
}

// Add CSS animation for fade-in effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
}
