'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to automatically refresh the Laravel API token in the background
 * when it's close to expiration (after 1 hour)
 */
export function useTokenRefresh() {
  const { data: session, update } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Function to refresh the token
  const refreshToken = useCallback(async () => {
    if (refreshing || !session?.idToken) return;
    
    try {
      setRefreshing(true);
      
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ id_token: session.idToken }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      // Update the session with the new token
      await update({
        ...session,
        laravelApiToken: data.token
      });
      
      // Store in localStorage as well for components that might use it directly
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminToken', data.token);
      }
      
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setRefreshing(false);
    }
  }, [session, refreshing, update]);
  
  // Set up a timer to refresh the token every 50 minutes (before the 1 hour expiration)
  useEffect(() => {
    if (!session?.laravelApiToken || !session?.idToken) return;
    
    // Initial check - if we don't have a lastRefresh time, set it to now
    if (!lastRefresh) {
      setLastRefresh(new Date());
    }
    
    // Set up interval to check if token needs refreshing
    const interval = setInterval(() => {
      if (!lastRefresh) return;
      
      const now = new Date();
      const minutesSinceLastRefresh = (now - lastRefresh) / (1000 * 60);
      
      // If it's been more than 50 minutes since the last refresh, refresh the token
      if (minutesSinceLastRefresh >= 50) {
        refreshToken();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [session, lastRefresh, refreshToken]);
  
  // Also refresh token when the component mounts if we have a session
  useEffect(() => {
    if (session?.laravelApiToken && session?.idToken && !lastRefresh) {
      // Set lastRefresh to now to prevent immediate refresh
      setLastRefresh(new Date());
    }
  }, [session, lastRefresh]);
  
  return { refreshToken, lastRefresh, refreshing };
}
