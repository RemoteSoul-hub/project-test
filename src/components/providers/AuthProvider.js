'use client';

import { createContext, useContext } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  setCrossDomainCookie, 
  setStandardCookie, 
  getCookie,
  setAuthStorageForReverseProxy,
  getAuthTokenFromAllStorages
} from '@/utils/cookieUtils';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (username, password) => {
    try {
      // First try traditional login
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Check if response is ok before trying to parse JSON
      if (response.ok) {
        try {
          // Check if there's content to parse
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            // Set cookie for server-side auth checks for traditional login
            // Use both traditional and cross-domain approach
            document.cookie = `auth_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
            setCrossDomainCookie('auth_token', data.token);
            
            // Ensure token is set using the more comprehensive function
            setAuthStorageForReverseProxy(data.token);
            
            // Store user data in localStorage and as cookie backup
            try {
              localStorage.setItem('user', JSON.stringify(data.user));
              // Store partner_id separately for easy access
              if (data.user?.partner_id) {
                localStorage.setItem('partner_id', data.user.partner_id);
              }
            } catch (e) {
              console.warn('Failed to store user data in localStorage:', e);
              // Store as cookies instead
              setCrossDomainCookie('user', JSON.stringify(data.user));
              if (data.user?.partner_id) {
                setCrossDomainCookie('partner_id', data.user.partner_id);
              }
            }

            // Log the data for debugging
            console.log('Login successful, data:', data);
            
            // Ensure token is set and then wait a moment for it to be readable
            await new Promise(resolve => setTimeout(resolve, 200)); // Small delay to ensure cookie is written

            // Always redirect to dashboard for non-admin users
            // Don't check roles, just redirect if we have a token
            router.push('/');
            
            return { success: true, data: data }; // Return data on success
          } else {
            // Handle non-JSON response, still consider it a success if response.ok
            console.log('Login successful but no JSON response');
            await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
            
            // Always redirect to dashboard
            router.push('/');
            
            return { success: true, data: {} }; // Return empty data for non-JSON success
          }
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          return {
            success: false,
            error: 'Invalid response format from server'
          };
        }
      } else {
        // Try to parse error response if possible
        try {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.message || 'Invalid credentials'
          };
        } catch (jsonError) {
          // If error response isn't valid JSON
          return {
            success: false,
            error: 'Invalid credentials'
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    // Determine if user is in admin section
    const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    
    const cookiesToRemove = [
      'auth_token', 'adminToken', 'laravel_token', 'user', 'partner_id'
    ];
    
    // Clear all cookies systematically
    for (const cookieName of cookiesToRemove) {
      // Standard cookies
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      // Cross-domain cookies
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`;
    }
    
    // Try to clear localStorage but handle potential security errors
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const keysToRemove = [
          'user', 'partner_id', 'adminToken', 'auth_token', 'laravel_token'
        ];
        
        for (const key of keysToRemove) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('Error clearing localStorage:', e);
      }
    }
    
    // Also try to clear sessionStorage
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('laravel_token');
      } catch (e) {
        console.warn('Error clearing sessionStorage:', e);
      }
    }
    
    // Sign out from NextAuth
    await signOut({ redirect: false });
    
    // Redirect to proper login page based on context
    if (isAdminPage) {
      router.push('/login?callbackUrl=/admin');
    } else {
      router.push('/login');
    }
  };

  const googleLogin = async (callbackUrl = '/') => {
    try {
      const result = await signIn('google', { 
        callbackUrl,
        redirect: true
      });
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  // Get token from all possible storage locations
  const getToken = () => {
    // First check the session (most reliable source)
    if (session?.laravelApiToken) {
      return session.laravelApiToken;
    }
    
    // Then use our specialized function to check all storages
    return getAuthTokenFromAllStorages();
  };

  const value = {
    user: session?.user || null,
    token: getToken(), // Use our improved token getter
    login,
    logout,
    googleLogin,
    isAuthenticated: !!session || !!getToken() || (typeof window !== 'undefined' && (
      document.cookie.includes('auth_token=') || 
      localStorage.getItem('auth_token')
    )),
    // An admin user is identified by role 'admin' in their session
    isAdmin: session?.isAdmin || (session?.user?.role === 'admin') || false,
    status,
    isLoading: status === 'loading'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
