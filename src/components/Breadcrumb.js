"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import ApiService from '../services/apiService';

/**
 * Breadcrumb Component
 * 
 * This component renders a breadcrumb navigation trail based on the current URL path.
 * @param {string} customTitle - Optional custom title to display instead of URL-based title
 * It's responsive and adapts to different screen sizes by truncating on mobile.
 */
export default function Breadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathSegments = pathname.split('/').filter(segment => segment);
  
  // Check if we're on get-started page with a service parameter
  const isGetStartedPage = pathname === '/get-started';
  const serviceParam = isGetStartedPage ? searchParams.get('service') : null;

  // If we have a service parameter, add it to the segments for breadcrumb display
  let effectiveSegments = [...pathSegments];
  if (serviceParam) {
    effectiveSegments.push(serviceParam);
  }

  // New logic for mobile display:
  let displaySegmentsMobile = [];
  let showEllipsisPrefixMobile = false;

  if (effectiveSegments.length > 0) {
    // Always show only the last segment for mobile if path is not home
    displaySegmentsMobile = [effectiveSegments[effectiveSegments.length - 1]];
    if (effectiveSegments.length > 1) {
      // Show ellipsis if there was more than one segment originally
      showEllipsisPrefixMobile = true;
    }
  }
  // If effectiveSegments.length is 0 (e.g. home page '/'), displaySegmentsMobile remains empty, shows only home icon.

  const [usernames, setUsernames] = useState({});
  const [loadingUsernames, setLoadingUsernames] = useState({});

  useEffect(() => {
    effectiveSegments.forEach((segment, index) => {
      const isUserPathSegment = effectiveSegments[0]?.toLowerCase() === 'users' && index === 1;
      const userId = isUserPathSegment ? segment : null;

      if (userId && !usernames[userId] && !loadingUsernames[userId]) {
        setLoadingUsernames(prev => ({ ...prev, [userId]: true }));
        const fetchUsername = async () => {
          try {
            const response = await ApiService.get(`/users/${userId}`);
            if (response && response.data && response.data.name) {
              setUsernames(prev => ({ ...prev, [userId]: response.data.name }));
            } else {
              setUsernames(prev => ({ ...prev, [userId]: userId })); // Fallback to ID
            }
          } catch (error) {
            console.error('Failed to fetch username:', error);
            setUsernames(prev => ({ ...prev, [userId]: userId })); // Fallback to ID on error
          } finally {
            setLoadingUsernames(prev => ({ ...prev, [userId]: false }));
          }
        };
        fetchUsername();
      }
    });
  }, [pathname, searchParams, effectiveSegments, usernames, loadingUsernames]);

  // Helper function to get display name for get-started service pages
  const getServiceDisplayName = (slug) => {
    const serviceMap = {
      'server-configuration': 'Server Configuration',
      'tailored-solutions': 'Tailored Solutions',
      'vps-infrastructure': 'VPS Infrastructure'
    };
    return serviceMap[slug] || slug;
  };

  const renderBreadcrumb = (segments, isMobile = false) => {
    return segments.map((segment, index) => {
      const originalSegmentIndex = isMobile 
        ? (effectiveSegments.length - displaySegmentsMobile.length + index) 
        : index;
      
      // For service parameter segments, handle differently
      const isServiceParameterSegment = serviceParam && originalSegmentIndex === effectiveSegments.length - 1;
      
      let currentPathSlice;
      let href;
      
      if (isServiceParameterSegment) {
        // For service parameter, link back to get-started without the parameter
        href = '/get-started';
        currentPathSlice = pathSegments; // Use original path segments
      } else {
        currentPathSlice = pathSegments.slice(0, originalSegmentIndex + 1);
        
        // Check for the specific pattern: infrastructure/vps/servers
        if (currentPathSlice.length >= 3 && 
            currentPathSlice[currentPathSlice.length - 3]?.toLowerCase() === 'infrastructure' &&
            currentPathSlice[currentPathSlice.length - 2]?.toLowerCase() === 'vps' &&
            currentPathSlice[currentPathSlice.length - 1]?.toLowerCase() === 'servers') {
          currentPathSlice[currentPathSlice.length - 1] = 'products';
        }
        
        href = '/' + currentPathSlice.join('/');
      }
      
      const isLastItemInOriginalPath = originalSegmentIndex === effectiveSegments.length - 1;
      
      let label = segment.toUpperCase();
      const isUserPathSegment = pathSegments[0]?.toLowerCase() === 'users' && originalSegmentIndex === 1;
      const userId = isUserPathSegment ? segment : null;
      
      // Specific truncation for User ID on /users/[id] page for mobile
      const isUserDetailsIdSegmentMobile = isMobile && isUserPathSegment && pathSegments.length === 2;

      if (isUserDetailsIdSegmentMobile && segment.length > 8) { 
        label = segment.substring(0, 4).toUpperCase() + '...';
      } else if (isMobile && segment.length > 15 && isLastItemInOriginalPath) { // More general truncation for long last segments on mobile
        label = segment.substring(0, 12).toUpperCase() + '...';
      }

      const formatLabel = (slug) => {
        return slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      let displayLabel;
      if (isUserPathSegment && usernames[userId]) {
        displayLabel = usernames[userId];
      } else if (isServiceParameterSegment) {
        displayLabel = getServiceDisplayName(segment);
      } else {
        displayLabel = formatLabel(label);
      }

      const isDisabled = ['INFRASTRUCTURE', 'VPS'].includes(label.toUpperCase());

      return isLastItemInOriginalPath || isDisabled ? (
        <span key={href} className="text-black font-semibold truncate">{displayLabel}</span>
      ) : (
        <Link key={href} href={href} className="text-gray-500 hover:underline truncate">
          {displayLabel}
        </Link>
      );
    });
  };

  return (
    <nav className="flex items-center space-x-1 md:space-x-2 max-w-full overflow-hidden text-sm md:text-sm"> {/* Adjusted spacing and text size */}
      {/* Home icon and link */}
      <Link href="/" className="text-gray-500 hover:text-gray-700 flex-shrink-0">
        <Home size={16} className="md:w-4 md:h-4" /> {/* Adjusted icon size */}
      </Link>

      {/* Desktop Breadcrumb Items */}
      <div className="hidden md:flex items-center space-x-2 overflow-hidden">
        {effectiveSegments.length > 0 && (
          <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
        )}
        {renderBreadcrumb(effectiveSegments, false).map((breadcrumbItem, idx) => (
          <span key={idx} className="flex items-center space-x-2 min-w-0">
            {idx > 0 && <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />}
            <div className="min-w-0">{breadcrumbItem}</div>
          </span>
        ))}
      </div>

      {/* Mobile Breadcrumb Items - Revised Logic */}
      <div className="flex md:hidden items-center space-x-1 overflow-hidden min-w-0"> {/* Added min-w-0 */}
        {effectiveSegments.length > 0 && ( /* Chevron after Home icon, if not on home page */
          <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
        )}
        {showEllipsisPrefixMobile && (
          <>
            <span className="text-gray-400 flex-shrink-0">...</span>
            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
          </>
        )}
        {/* Render the single mobile segment if it exists */}
        {displaySegmentsMobile.length > 0 && renderBreadcrumb(displaySegmentsMobile, true).map((breadcrumbItem, idx) => (
          // The map will run at most once. We take the first (and only) element.
          <div key={idx} className="min-w-0 truncate">{breadcrumbItem}</div>
        ))}
      </div>
    </nav>
  );
}