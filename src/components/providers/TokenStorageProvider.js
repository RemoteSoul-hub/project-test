'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  setStorageWithCookieFallback,
  removeStorageWithCookieFallback,
  setAuthStorageForReverseProxy 
} from '@/utils/cookieUtils';

export function TokenStorageProvider({ children }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('TokenStorageProvider - Status:', status);
    console.log('TokenStorageProvider - Session:', session);
    console.log('TokenStorageProvider - Laravel Token:', session?.laravelApiToken);
    console.log('TokenStorageProvider - Should Set Cookie:', session?.shouldSetCookie);
    
    if (status === 'authenticated' && session?.laravelApiToken) {
      // Use the specialized function for storing auth tokens in reverse proxy environments
      const success = setAuthStorageForReverseProxy(session.laravelApiToken);
      
      if (success) {
        console.log('Laravel token stored with reverse proxy compatibility:', session.laravelApiToken);
      } else {
        console.warn('Failed to store Laravel token reliably. Authentication might not persist.');
      }
    } else if (status === 'unauthenticated') {
      // Clear the token when user is not authenticated
      try {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('laravel_token');
      } catch (e) {
        console.warn('Error removing token from localStorage:', e);
      }
      
      // Always clear cookies too
      removeStorageWithCookieFallback('adminToken');
      removeStorageWithCookieFallback('laravel_token');
      console.log('Laravel tokens removed from storage');
    } else if (status === 'authenticated' && !session?.laravelApiToken) {
      console.log('Session is authenticated but no Laravel token found');
    }
  }, [session, status]);
  
  return children;
}
