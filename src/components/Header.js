'use client';

import Breadcrumb from './Breadcrumb';
import { useAuth } from '@/components/providers/AuthProvider'; // Keep as fallback
import { useState, useEffect } from 'react';
import { isImpersonating, getImpersonatedUser, getUser } from '@/services/AuthService'; // Import auth functions

/**
 * Header Component
 *
 * This component renders the application's header section.
 * It includes breadcrumb navigation and user profile avatar.
 * It's responsive and adapts to different screen sizes.
 *
 * @param {Object} props - Component props
 * @param {Function} props.toggleSidebar - Function to toggle the sidebar on mobile
 */
export default function Header({ toggleSidebar }) {
  const { user } = useAuth();
  const [initials, setInitials] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    let currentUser = null;
    try {
      if (isImpersonating()) {
        // If impersonating, get the impersonated user from localStorage
        currentUser = getImpersonatedUser();
        
      } else {
        // Otherwise, get the regular user from localStorage
        currentUser = getUser();
        
      }

      if (currentUser?.name) {
        setUserName(currentUser.name);
        setInitials(currentUser.name.substring(0, 2).toUpperCase());
      } else {
        // Fallback to AuthProvider user if localStorage data is missing/invalid
        
        if (user) {
          const name = user.name || user.username || '';
          setUserName(name);
          if (name) {
            setInitials(name.substring(0, 2).toUpperCase());
          } else {
            setInitials('');
          }
        } else {
          // Final fallback if everything fails
          setUserName('');
          setInitials('');
        }
      }
    } catch (error) {
      console.error('Error getting user data for header:', error);
      // Attempt fallback to useAuth user on error
      if (user) {
        const name = user.name || user.username || '';
        setUserName(name);
        setInitials(name ? name.substring(0, 2).toUpperCase() : '');
      } else {
        setUserName('');
        setInitials('');
      }
    }
  }, [user]); // Keep 'user' dependency for the fallback logic

  return (
    <header className="w-full bg-white border-b border-gray-100 rounded-t-none md:rounded-t-lg">
      <div className="flex justify-between items-center px-2 md:px-8 py-4">
        {/* Left section - Breadcrumb only */}
        <div className="flex items-center flex-1 min-w-0 mr-2 md:mr-4"> {/* Added flex-1, min-w-0 and right margin */}
          <Breadcrumb />
        </div>

        {/* Right section - User avatar with name */}
        <div className="flex items-center gap-3 md:gap-6 flex-shrink-0"> {/* Added flex-shrink-0 */}
          {/* User Avatar with name */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium"
              title={userName}
            >
              {initials}
            </div>
            {userName && (
              <span className="text-gray-700 font-medium hidden md:block">
                {userName}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
