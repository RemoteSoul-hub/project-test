'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAdminToken } from '@/hooks/useAdminToken';
import Header from './Header';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

/**
 * Main Layout Component
 * 
 * This component creates a two-column layout with a sidebar and main content area.
 * It's fully responsive, using Tailwind's responsive classes to adjust for different screen sizes.
 * On mobile, the sidebar becomes a slide-in menu that can be toggled with a button.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in the main content area
 */
export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const { isAuthenticated } = useAdminToken();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Prevent hydration mismatch by waiting for client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Only show sidebar if user is authenticated (not loading, not unauthenticated)
  const shouldShowSidebar = isHydrated && (status === 'authenticated' || isAuthenticated);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.sidebar-toggle')) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // If still loading session, show a minimal loading state
  if (status === 'loading') {
    return (
      <div className="h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f0f2f5] flex flex-col">
      {/* Only show mobile toggle if sidebar should be visible */}
      {shouldShowSidebar && (
        <div className="md:hidden fixed top-4 left-4 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-toggle p-2 bg-white rounded-none md:rounded-lg shadow-sm text-gray-600 hover:bg-gray-100"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row flex-1 h-full gap-4">
        {/* Only render sidebar if user is authenticated */}
        {shouldShowSidebar && (
          <div className={`sidebar-container fixed top-0 bottom-0 left-0 z-40 w-[280px] transition-transform duration-300 ease-in-out transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:static md:w-[320px] md:translate-x-0 md:top-auto md:bottom-auto md:z-20`}>
            <div className="bg-white rounded-none md:rounded-lg shadow-sm h-full flex flex-col">
              <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col">
          <div className="bg-primary-light dark:bg-primary-dark rounded-none md:rounded-lg shadow-sm flex flex-col flex-grow overflow-hidden">
            {/* Only show Header if authenticated */}
            {shouldShowSidebar && <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
      
      {/* Only show overlay if sidebar should be visible and is open */}
      {shouldShowSidebar && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}