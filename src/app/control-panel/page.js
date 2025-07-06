'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import UserDetailsContent from '@/components/user/UserDetailsContent';
import ApiService from '@/services/apiService';
import { useAuth } from '@/components/providers/AuthProvider';
import { isImpersonating, getImpersonatedUser, getUser } from '@/services/AuthService';

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState(null);
  const [infrastructureData, setInfrastructureData] = useState([]);
  const [paginationLinks, setPaginationLinks] = useState(null); // Added for pagination
  const [paginationMeta, setPaginationMeta] = useState(null);   // Added for pagination
  const [loading, setLoading] = useState(true); // Overall page loading
  const [loadingServers, setLoadingServers] = useState(false); // Specific loading for servers list
  const [error, setError] = useState(null); // Combined error state
  const { user: authUser } = useAuth();
  
  // Check if user is authenticated
  const isUserLoggedIn = () => {
    try {
      // Check if impersonating or regular user exists
      if (isImpersonating()) {
        const impersonatedUser = getImpersonatedUser();
        return !!impersonatedUser;
      } else {
        const regularUser = getUser();
        return !!regularUser;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Fallback to AuthProvider user
      return !!authUser;
    }
  };

  // Function to fetch user details
  async function fetchUserDetails() {
    try {
      const userData = await ApiService.get(`/users/${userId}`);
      const userDataFromResponse = userData.data;
      const formattedUser = {
        id: userDataFromResponse.id,
        fullName: userDataFromResponse.name,
        email: userDataFromResponse.email,
        phoneNumber: userDataFromResponse.phone_number || '',
        language: 'English', // Default value since we're ignoring language
        username: userDataFromResponse.username || '',
        userCreated: formatDate(userDataFromResponse.created_at), // Use formatDate defined below
        roles: userDataFromResponse.roles || [],
        login_username: userDataFromResponse.login_username || '', // Add the login_username field
      };
      
      
      setUser(formattedUser);
      // Clear user-specific part of error if successful
      setError(prev => prev?.replace('Failed to load user details.', '').trim() || null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(prev => prev ? `${prev} Failed to load user details.` : 'Failed to load user details.');
      setUser(null); // Ensure user is null on error
    }
  }

  // Function to fetch user servers with pagination support
  async function fetchUserServers(page = 1) {
    setLoadingServers(true);
    // Clear only server-specific errors before fetching
    setError(prev => prev?.replace('Failed to load infrastructure data.', '').trim() || null); 
    try {
      const serversResponse = await ApiService.getUserServers(userId, { page });
      
      setInfrastructureData(serversResponse.data || []);
      setPaginationLinks(serversResponse.links);
      setPaginationMeta(serversResponse.meta);
    } catch (serverError) {
      console.error(`Error fetching user servers (page ${page}):`, serverError);
      setError(prevError => prevError ? `${prevError} Failed to load infrastructure data.` : 'Failed to load infrastructure data.');
      setInfrastructureData([]); // Set to empty array on error
      setPaginationLinks(null);
      setPaginationMeta(null);
    } finally {
      setLoadingServers(false);
    }
  }

  useEffect(() => {
    async function initialLoad() {
      if (!userId) return;
      setLoading(true); // Start overall loading
      setError(null); // Reset errors on new load
      await fetchUserDetails(); // Fetch user details first
      await fetchUserServers(1); // Then fetch the first page of servers
      setLoading(false); // End overall loading
    }
    initialLoad();
  }, [userId]); // Rerun effect only if userId changes

  // Handle page changes for server list
  const handleServerPageChange = (newPage) => {
    // Check if newPage is valid based on meta
    if (newPage >= 1 && (!paginationMeta || newPage <= paginationMeta.last_page)) {
      fetchUserServers(newPage);
    } else {
      console.warn(`Attempted to navigate to invalid page: ${newPage}`);
    }
  };
  
  // Helper function to format date (ensure it's defined before use)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  if (loading) {
    return <div className="p-6 text-center">Loading user data...</div>;
  }
  
  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }
  
  if (!user) {
    return <div className="p-6 text-center">User not found</div>;
  }

  // Separate check for user data error vs server data error
  if (!user && !loading) { // If user failed to load entirely
     // Display error only if there's a user-specific error or a general one not related to servers
     const userError = error?.replace('Failed to load infrastructure data.', '').trim();
     if (userError) {
       return <div className="p-6 text-center text-red-600">{userError}</div>;
     } else {
       // If no specific user error, show generic message
       return <div className="p-6 text-center">User not found or failed to load.</div>;
     }
  }
  
  // If user loaded but servers might have failed, we can still render UserDetailsContent
  // UserDetailsContent will handle the potential server error message and loading state

  return (
    <UserDetailsContent 
      user={user} 
      infrastructureData={infrastructureData}
      userId={userId}
      paginationLinks={paginationLinks}
      paginationMeta={paginationMeta}
      onPageChange={handleServerPageChange}
      loadingServers={loadingServers} 
      serverError={error?.includes('infrastructure') ? error : null} // Pass only server-specific error
      isLoggedIn={isUserLoggedIn()}
    />
  );
}