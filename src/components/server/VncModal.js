'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/Modal';

/**
 * VNC Modal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when the modal is closed
 * @param {Object} props.vncData - VNC connection data
 * @param {string} props.vncData.socket_hash - Socket hash for VNC connection
 * @param {string} props.vncData.socket_password - Socket password for VNC connection
 */
export default function VncModal({ isOpen, onClose, vncData }) {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !vncData) return;
    
    // Reset states when modal opens
    setIsLoading(true);
    setError(null);
    
    // Setup iframe for VNC client
    const setupVncClient = () => {
      if (iframeRef.current && vncData) {
        // Set up iframe source with connection parameters
        // We only need socket_hash and socket_password for the existing implementation
        const iframeSrc = `/vnc-client.html?password=${encodeURIComponent(vncData.socket_password)}&path=${encodeURIComponent(vncData.socket_hash)}`;
        iframeRef.current.src = iframeSrc;
        
        // Handle iframe load events
        iframeRef.current.onload = () => {
          setIsLoading(false);
        };
        
        iframeRef.current.onerror = (e) => {
          setIsLoading(false);
          setError('Failed to load VNC client');
          console.error('VNC iframe load error:', e);
        };
      }
    };
    
    setupVncClient();
    
    // Cleanup function
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
      }
    };
  }, [isOpen, vncData]);

  // If no VNC data is provided, don't render the modal
  if (!vncData) return null;

  // Handle refreshing the VNC connection
  const refreshConnection = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      setError(null);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="VNC Console" 
      size="5xl"
    >
      <div className="flex flex-col h-[80vh]">
        {/* Error message if any */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* VNC Client Container */}
        <div className="flex-grow bg-black rounded-md overflow-hidden relative">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
                <p className="text-white">Connecting to VNC server...</p>
              </div>
            </div>
          )}
          
          {/* VNC iframe */}
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
            title="VNC Console"
          />
        </div>
        
        {/* Controls */}
        <div className="mt-4 flex justify-end">
          <button 
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm mr-2"
            onClick={refreshConnection}
            disabled={isLoading}
          >
            Refresh Connection
          </button>
          <button 
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm"
            onClick={onClose}
          >
            Close VNC
          </button>
        </div>
      </div>
    </Modal>
  );
}
