'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SessionProvider } from 'next-auth/react';
import ImpersonationBar from '@/components/ImpersonationBar';
import { isImpersonating } from '@/services/AuthService';
import ApiService from '@/services/apiService';

/**
 * Root Layout Wrapper Component
 * 
 * This component determines whether to apply the main layout or not
 * based on the current path. Auth pages typically don't use the main layout.
 * It wraps the entire application with SessionProvider for NextAuth and
 * AuthProvider for authentication context.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {Object} props.session - Session data from NextAuth
 */
export default function RootLayoutWrapper({ children, session }) {
  const pathname = usePathname();
  const [showImpersonationBar, setShowImpersonationBar] = useState(false);
  
  // Check if the current page is an auth page (login, signup, etc.) or admin page
  const isAuthOrAdminPage = pathname?.startsWith('/login') || 
                           pathname?.startsWith('/signup') || 
                           pathname?.startsWith('/auth') ||
                           pathname?.startsWith('/control-panel') ||
                           pathname?.startsWith('/admin');

  // State to store fetched usernames for dynamic titles
  const [fetchedUsernames, setFetchedUsernames] = useState({});

  // Function to format path segment into a readable title part
  const formatSegmentForTitle = async (segment, index, allSegments) => {
    if (!segment) return '';

    // Handle root path
    if (segment === '' && allSegments.length === 0) {
      return 'Home';
    }

    // Handle user ID segment
    if (allSegments[0]?.toLowerCase() === 'users' && index === 1) {
      const userId = segment;
      if (fetchedUsernames[userId]) {
        return fetchedUsernames[userId];
      }
      // Fetch username if not already fetched
      if (!fetchedUsernames[userId] && !fetchedUsernames[`${userId}_loading`]) {
        setFetchedUsernames(prev => ({ ...prev, [`${userId}_loading`]: true }));
        try {
          const response = await ApiService.get(`/users/${userId}`);
          if (response && response.data && response.data.name) {
            setFetchedUsernames(prev => ({ ...prev, [userId]: response.data.name, [`${userId}_loading`]: false }));
            return response.data.name;
          }
        } catch (error) {
          console.error(`Failed to fetch username for ${userId}:`, error);
        } finally {
          setFetchedUsernames(prev => ({ ...prev, [`${userId}_loading`]: false }));
        }
      }
      return segment; // Return UUID while loading or on error
    }

    // General formatting for other segments
    return segment
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
      .join(' ');
  };

  // Effect to update the document title
  useEffect(() => {
    const updateTitle = async () => {
      const pathSegments = pathname.split('/').filter(segment => segment);
      let pageTitleParts = [];

      if (pathSegments.length === 0) {
        pageTitleParts.push('Home');
      } else {
        for (let i = 0; i < pathSegments.length; i++) {
          const formatted = await formatSegmentForTitle(pathSegments[i], i, pathSegments);
          pageTitleParts.push(formatted);
        }
      }

      const dynamicTitle = pageTitleParts.join(' > ');
      document.title = `Partner Portal - ${dynamicTitle}`;
    };

    updateTitle();
  }, [pathname, fetchedUsernames]); // Re-run when pathname or fetchedUsernames changes

  // Check impersonation status on the client side after mount
  useEffect(() => {
    setShowImpersonationBar(isImpersonating());
  }, [pathname]); // Re-check if path changes, although storage is the source of truth

  // Wrap everything with SessionProvider and AuthProvider
  return (
    <SessionProvider session={session}>
      <AuthProvider>
        {/* Conditionally render ImpersonationBar *before* main content */}
        {/* Show only if impersonating AND not on an auth/admin page */}
        {showImpersonationBar && !isAuthOrAdminPage && <ImpersonationBar />}

        {/* Render main content */}
        {isAuthOrAdminPage ? (
          children // Render children directly for auth/admin pages
        ) : (
          <Layout>{children}</Layout> // Apply main layout for other pages
        )}
      </AuthProvider>
    </SessionProvider>
  );
}
