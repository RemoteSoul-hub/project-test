'use client';

import { useSession } from 'next-auth/react';
import { getAuthTokenFromAllStorages } from '@/utils/cookieUtils';

export function useAdminToken() {
  const { data: session, status } = useSession();

  const getToken = () => {
    if (session?.laravelApiToken) {
      return session.laravelApiToken;
    }
    
    // Only check storage if we're actually authenticated via NextAuth
    // or if we're not in a loading state
       if (status !== 'loading') {
      return getAuthTokenFromAllStorages();
    }
    return null;
  };

  const token = getToken();

  return {
    token,
    isAuthenticated: status === 'authenticated' || (status === 'unauthenticated' && !!token),
    isLoading: status === 'loading',
    isAdmin: session?.isAdmin || false
  };
}
