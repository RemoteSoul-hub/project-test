'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Logo from '@/assets/images/thinkhuge-logo.svg';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function MarketingHeader({ onAuthToggle }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Determine which auth link to show based on current path
  const isOnLoginPage = pathname === '/login' || pathname === '/';
  const authText = isOnLoginPage ? 'Register' : 'Login';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleAuthClick = (e) => {
    e.preventDefault();
    if (onAuthToggle) {
      onAuthToggle(); // Use the smooth animation system
    } else {
      // Fallback to regular navigation if no handler provided
      window.location.href = isOnLoginPage ? '/register' : '/login';
    }
  };

  return (
    <header className="relative bg-transparent">
      {/* Main header */}
      <div className="flex justify-between items-center p-4 sm:p-6">
        {/* Logo */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Image
            src={Logo}
            alt="ThinkHuge Logo"
            width={180}
            height={40}
            priority
            className="transition-all dark:invert w-32 h-auto sm:w-44 md:w-48"
          />
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <button
            onClick={handleAuthClick}
            className="text-text-light dark:text-text-dark font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-block"
          >
            {authText}
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center space-x-3 md:hidden">
          <ThemeToggle />
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-text-light dark:text-text-dark" />
            ) : (
              <Menu className="w-5 h-5 text-text-light dark:text-text-dark" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg md:hidden z-50">
          <div className="p-4 space-y-3">
            <button
              onClick={(e) => {
                handleAuthClick(e);
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left text-text-light dark:text-text-dark font-medium px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {authText}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}