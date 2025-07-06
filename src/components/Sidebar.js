'use client';

import Link from 'next/link';
import Image from 'next/image';
import logo from '@/assets/images/logo.svg';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  Home,
  Server,
  Package,
  Mail,
  Users,
  FileText,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  Grid,
  Database,
  Monitor,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

/**
 * Sidebar Component
 * 
 * This component renders the application's sidebar navigation.
 * It includes a logo, navigation links, and a logout button.
 * On mobile, it includes a close button to dismiss the sidebar.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onCloseMobile - Function to call when closing the sidebar on mobile
 */
export default function Sidebar({ onCloseMobile }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  
  // State for expandable menu sections - all collapsed by default
  const [infrastructureOpen, setInfrastructureOpen] = useState(false);
  const [dedicatedServersOpen, setDedicatedServersOpen] = useState(false);
  const [vpsOpen, setVpsOpen] = useState(false);
  
  // Load saved state from localStorage on component mount
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const savedInfrastructureOpen = localStorage.getItem('infrastructureOpen') === 'true';
      const savedDedicatedServersOpen = localStorage.getItem('dedicatedServersOpen') === 'true';
      const savedVpsOpen = localStorage.getItem('vpsOpen') === 'true';
      
      setInfrastructureOpen(savedInfrastructureOpen);
      setDedicatedServersOpen(savedDedicatedServersOpen);
      setVpsOpen(savedVpsOpen);
      
      // Auto-expand sections based on current path
      if (pathname.startsWith('/infrastructure') && !savedInfrastructureOpen) {
        setInfrastructureOpen(true);
        localStorage.setItem('infrastructureOpen', 'true');
        
        if (pathname.startsWith('/infrastructure/dedicated') && !savedDedicatedServersOpen) {
          setDedicatedServersOpen(true);
          localStorage.setItem('dedicatedServersOpen', 'true');
        }
        
        if (pathname.startsWith('/infrastructure/vps') && !savedVpsOpen) {
          setVpsOpen(true);
          localStorage.setItem('vpsOpen', 'true');
        }
      }
      
    }
  }, [pathname]);
  
  // Save state to localStorage when it changes
  const toggleInfrastructure = () => {
    const newState = !infrastructureOpen;
    setInfrastructureOpen(newState);
    localStorage.setItem('infrastructureOpen', newState.toString());
  };
  
  const toggleDedicatedServers = () => {
    const newState = !dedicatedServersOpen;
    setDedicatedServersOpen(newState);
    localStorage.setItem('dedicatedServersOpen', newState.toString());
  };
  
  const toggleVps = () => {
    const newState = !vpsOpen;
    setVpsOpen(newState);
    localStorage.setItem('vpsOpen', newState.toString());
  };
  
  // Check if the current path matches the link path
  const isActive = (path) => {
    return pathname === path;
  };

  // Check if a path is part of the current path (for parent menu items)
  const isPartOfPath = (path) => {
    return pathname.startsWith(path);
  };

  // Handle navigation on mobile - close the sidebar
  const handleNavigation = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Logout handler
  const handleLogout = () => {
    if (logout) {
      logout();
      if (onCloseMobile) onCloseMobile();
    } else {
      console.error('Logout function is not available');
    }
  };

  return (
    <div className="w-full h-full bg-[#232436] text-gray-400 flex flex-col rounded-none md:rounded-lg overflow-y-auto">
      {/* Logo and mobile close button */}
      <div className="p-4 md:p-6 flex justify-between items-center">
        <div className="w-[190px]">
          <Image
            src={logo}
            alt="Broker Panel"
            width={190}
            height={32} // Approximate height based on aspect ratio for 190px width
            className="w-full h-auto" // Ensures responsiveness within the container
          />
        </div>
        <button 
          onClick={onCloseMobile} 
          className="md:hidden text-gray-400 hover:text-white"
          aria-label="Close sidebar"
        >
          <X size={24} />
        </button>
        
      </div>

      {/* Navigation */}
              {/* New Badge */}
              <div className="mb-8 mx-auto">
                <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium text-purple-200 true-gradient-border">
                  <span className="rounded-full mr-2 th-gradient py-1 px-2 text-sm text-white relative z-10">
                    New
                  </span>
                  <span className="ml-2 text-white text-base font-semibold relative z-10">Your AI Assistant ✨</span>
                </span>
              </div>
      <nav className="flex-1 px-2 md:px-4">
        {/* Dashboard */}
        <Link href="/" onClick={handleNavigation}>
          <div className={`flex items-center gap-3 p-2 md:p-3 rounded-none md:rounded-lg mb-2 ${
            isActive('/') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
          }`}>
            <Grid size={20} />
            <span>Dashboard</span>
          </div>
        </Link>
        <Link href="/get-started" onClick={handleNavigation}>
          <div className={`flex items-center gap-3 p-2 md:p-3 rounded-none md:rounded-lg mb-2 ${
            isActive('/get-started') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
          }`}>
            <ArrowRight size={20} />
            <span>Get Started</span>
          </div>
        </Link>
        
        {/* Infrastructure Section */}
        <div className="mb-2">
          <div 
            className={`flex items-center justify-between p-2 md:p-3 rounded-none md:rounded-lg cursor-pointer ${
              isPartOfPath('/infrastructure') ? 'text-white' : ''
            } hover:bg-[#2D2F3D]`}
            onClick={toggleInfrastructure}
          >
            <div className="flex items-center gap-3">
              <Server size={20} />
              <span>Infrastructure</span>
            </div>
            {infrastructureOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          
          {infrastructureOpen && (
            <div className="ml-7 mt-1 space-y-1">
              {/* Integrations */}
              <Link href="/infrastructure/integrations" onClick={handleNavigation}>
                <div className={`flex items-center p-1 md:p-2 rounded-none md:rounded-lg ${
                  isActive('/infrastructure/integrations') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
                }`}>
                  <span>Integrations</span>
                </div>
              </Link>
              
              {/* Dedicated Servers Section */}
              <div>
                <div 
                  className={`flex items-center justify-between p-1 md:p-2 rounded-none md:rounded-lg cursor-pointer ${
                    isPartOfPath('/infrastructure/dedicated') ? 'text-white' : ''
                  } hover:bg-[#2D2F3D]`}
                  onClick={toggleDedicatedServers}
                >
                  <div className="flex items-center">
                    <span>Dedicated Servers</span>
                  </div>
                  {dedicatedServersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                
                {dedicatedServersOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {/* Products */}
                    <Link href="/infrastructure/dedicated/products" onClick={handleNavigation}>
                      <div className={`flex items-center p-1 md:p-2 rounded-none md:rounded-lg ${
                        isActive('/infrastructure/dedicated/products') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
                      }`}>
                        <span>Products</span>
                      </div>
                    </Link>
                    
                    {/* Users */}
                    <Link href="/infrastructure/dedicated/users" onClick={handleNavigation}>
                      <div className={`flex items-center p-1 md:p-2 rounded-none md:rounded-lg ${
                        isActive('/infrastructure/dedicated/users') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
                      }`}>
                        <span>Users</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
              
              {/* VPS Section */}
              <div>
                <div 
                  className={`flex items-center justify-between p-1 md:p-2 rounded-none md:rounded-lg cursor-pointer ${
                    isPartOfPath('/infrastructure/vps') ? 'text-white' : ''
                  } hover:bg-[#2D2F3D]`}
                  onClick={toggleVps}
                >
                  <div className="flex items-center">
                    <span>VPS</span>
                  </div>
                  {vpsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                
                {vpsOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {/* Products */}
                    <Link href="/infrastructure/vps/products" onClick={handleNavigation}>
                      <div className={`flex items-center p-1 md:p-2 rounded-none md:rounded-lg ${
                        isActive('/infrastructure/vps/products') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
                      }`}>
                        <span>Products</span>
                      </div>
                    </Link>
                    
                    {/* Users */}
                    <Link href="/infrastructure/vps/users" onClick={handleNavigation}>
                      <div className={`flex items-center p-1 md:p-2 rounded-none md:rounded-lg ${
                        isActive('/infrastructure/vps/users') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
                      }`}>
                        <span>Users</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Emails */}
        <Link href="/email-templates" onClick={handleNavigation}>
          <div className={`flex items-center gap-3 p-2 md:p-3 rounded-none md:rounded-lg mb-2 ${
            isActive('/email-templates') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
          }`}>
            <Mail className="w-5 h-5" />
            <span>Email Templates</span>
          </div>
        </Link>

        {/* View Emails */}
        <Link href="/emails" onClick={handleNavigation}>
          <div className={`flex items-center gap-3 p-2 md:p-3 rounded-none md:rounded-lg mb-2 ${
            isActive('/emails') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
          }`}>
            <Mail className="w-5 h-5" /> {/* Using Mail icon for now */}
            <span>Emails</span>
          </div>
        </Link>
        
        {/* Users */}
        <Link href="/users" onClick={handleNavigation}>
          <div className={`flex items-center gap-3 p-2 md:p-3 rounded-none md:rounded-lg mb-2 ${
            isActive('/users') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
          }`}>
            <Users size={20} />
            <span>Users</span>
          </div>
        </Link>
        
        {/* Billing */}
        <Link href="/billing" onClick={handleNavigation}>
          <div className={`flex items-center gap-3 p-2 md:p-3 rounded-none md:rounded-lg mb-2 ${
            isActive('/billing') ? 'text-white bg-[#2D2F3D]' : 'hover:bg-[#2D2F3D]'
          }`}>
            <FileText size={20} />
            <span>Billing</span>
          </div>
        </Link>
        
        {/* Support (coming soon) */}
        <div className="flex items-center gap-3 p-2 md:p-3 rounded-none md:rounded-lg hover:bg-[#2D2F3D] mb-2 opacity-50">
          <HelpCircle size={20} />
          <span>Support (coming soon)</span>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-2 md:p-4 mt-auto">
        <div 
          onClick={handleLogout}
          className="flex items-center gap-3 p-2 md:p-3 rounded-none md:rounded-lg hover:bg-[#2D2F3D] cursor-pointer"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </div>
      </div>
    </div>
  );
}
