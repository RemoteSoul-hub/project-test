'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Helper function to set cookies that work across domains
 * @param {string} name Cookie name
 * @param {string} value Cookie value
 * @param {number} days Expiration in days
 */
function setCrossDomainCookie(name, value, days = 30) {
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + (days * 24 * 60 * 60 * 1000));
  
  // Set as a secure cookie with SameSite=None to work across domains
  // Note: SameSite=None requires Secure to be set
  const cookie = `${name}=${encodeURIComponent(value)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=None; Secure`;
  
  if (typeof document !== 'undefined') {
    document.cookie = cookie;
  }
}

/**
 * Helper function to get a cookie value
 * @param {string} name Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }
  
  return null;
}

export function useTokenStorage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('useTokenStorage - Status:', status);
    console.log('useTokenStorage - Session:', session);
    console.log('useTokenStorage - Laravel Token:', session?.laravelApiToken);
    
    if (status === 'authenticated' && session?.laravelApiToken) {
      // Store the Laravel token in both localStorage (for direct access) and cookie (for cross-domain)
      try {
        localStorage.setItem('adminToken', session.laravelApiToken);
        console.log('Laravel token stored in localStorage:', session.laravelApiToken);
      } catch (e) {
        console.warn('Failed to store token in localStorage. Likely a cross-origin issue:', e);
      }
      
      // Always set as cookie as a failsafe for reverse proxy scenarios
      setCrossDomainCookie('adminToken', session.laravelApiToken);
      console.log('Laravel token stored in cross-domain cookie');
    } else if (status === 'unauthenticated') {
      // Clear the token when user is not authenticated
      try {
        localStorage.removeItem('adminToken');
      } catch (e) {
        console.warn('Failed to remove token from localStorage:', e);
      }
      
      // Clear the cookie by setting expiration in the past
      if (typeof document !== 'undefined') {
        document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      }
      
      console.log('Laravel token removed from storage');
    } else if (status === 'authenticated' && !session?.laravelApiToken) {
      console.log('Session is authenticated but no Laravel token found');
    }
  }, [session, status]);

  // Get token from session, localStorage, or cookie (in that order of preference)
  const getToken = () => {
    if (session?.laravelApiToken) return session.laravelApiToken;
    
    let token = null;
    
    // Try localStorage first
    try {
      token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    } catch (e) {
      console.warn('Error accessing localStorage:', e);
    }
    
    // If not in localStorage, try cookies
    if (!token) {
      token = getCookie('adminToken');
    }
    
    return token;
  };

  return {
    token: getToken(),
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading'
  };
}
