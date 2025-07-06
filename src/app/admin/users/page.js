'use client'
import { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation'; // Keep this

import Table from '@/components/table/Table';
import TableToolbar from '@/components/table/TableToolbar';
import FilterPanel from '@/components/table/FilterPanel';
import UserAddModal from '@/components/user/UserAddModal'; // Added
// import DeleteUserModal from '@/components/user/DeleteUserModal'; // Add if delete needed
import AdminApiService from '@/services/adminApiService'; // Updated path
import { getAuthToken, startImpersonation, stopImpersonation } from '@/services/AuthService'; // Import startImpersonation and stopImpersonation
export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession(); // Keep session for token
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Keep error state
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalSearchCount, setTotalSearchCount] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(''); // Added role filter state
  // const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Add if delete needed
  // const [userToDelete, setUserToDelete] = useState(null); // Add if delete needed

  // Debug effect - only logs, no state updates
  useEffect(() => {
    // Removed debug logging
  }, [session, status]); // Only run when session or status changes

  // Initial data load
  useEffect(() => {
    const token = session?.laravelApiToken;
    if (token && status === "authenticated") {
      fetchUsers(token, currentPage, searchTerm, sortField, sortDirection);
    } else if (status === "loading") {
      // Optionally handle loading state for session
      setLoading(true);
    } else {
      // Handle unauthenticated state if necessary, e.g., redirect or show message
      setLoading(false);
      setError("Authentication required.");
    }
  }, [session, status]); // Depend only on session and status for initial load trigger

  // Debounced fetch/search on changes
  useEffect(() => {
    const token = session?.laravelApiToken || getAuthToken();
    if (token && status === "authenticated") {
      // Debounce search term changes
      const delayDebounceFn = setTimeout(() => {
        if (searchTerm) {
          searchUsers(token, searchTerm); // Search triggers separate state updates
        } else {
          // Fetch full list when search is cleared or other params change
          setSearchResults([]); // Clear search results
          fetchUsers(token, currentPage, searchTerm, sortField, sortDirection);
        }
      }, 300); // Debounce time

      return () => clearTimeout(delayDebounceFn);
    }
    // Don't run if session is loading or not authenticated
  }, [searchTerm, currentPage, sortField, sortDirection, session, status]); // Include all relevant dependencies

  const fetchUsers = async (token, page, search, sort, direction) => {
      // Added token parameter
      try {
        setLoading(true);
      setError(null); // Clear previous errors
      const params = {};
      if (page > 1) params.page = page;
      // Use filter[key] format for consistency
      if (search) params['filter[search]'] = search;
      if (sort) {
        params.sort = direction === 'desc' ? `-${sort}` : sort;
      }

      // Use static AdminApiService method
      const data = await AdminApiService.getUsers(token, params); // Pass token

      setUsers(data.data);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setError(error.message || "Failed to fetch users"); // Set error state
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (token, search) => {
    // Added token parameter
    try {
      setSearchLoading(true);
      const params = {
        'filter[search]': search,
        limit: 5 // Limit search results in dropdown
      };

      // Use static AdminApiService method
      const data = await AdminApiService.getUsers(token, params); // Pass token

      setSearchResults(data.data);
      // Ensure meta and total exist before accessing
      setTotalSearchCount(data.meta?.total || data.data?.length || 0);
    } catch (error) {
      console.error('Error searching admin users:', error);
      setSearchResults([]);
      setTotalSearchCount(0);
      // Optionally set main error state: setError(error.message || "Failed to search users");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleShowAllResults = () => {
    // Added function to fetch all results based on current search term
    const token = session?.laravelApiToken || getAuthToken();
    if (token && status === "authenticated") {
      setLoading(true); // Show loading indicator
      setCurrentPage(1); // Reset to page 1 for full results
      fetchUsers(token, 1, searchTerm, sortField, sortDirection);
    }
  };


  // Styling for roles - Added from reference
  const getRoleStyles = (role) => {
    // Adjust roles and styles as needed for admin context
    switch (role && role.toLowerCase()) {
      case 'admin': // Example admin role style
        return 'bg-red-100 text-red-600';
      case 'partner':
        return 'bg-blue-100 text-blue-600';
      case 'user':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Format date - Added from reference
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Ensure valid date before formatting
    if (isNaN(date.getTime())) return 'Invalid Date';
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Get short name - Added from reference
  const getShortName = (fullName) => {
    if (!fullName) return '';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0];
    // Ensure names[names.length - 1] exists before charAt
    return `${names[0]} ${names[names.length - 1] ? names[names.length - 1].charAt(0) + '.' : ''}`;
  };

  // Static role options - Added from reference, adjust for admin context
  // Fetch these dynamically if needed
  const availableRoles = ['Partner']; // Example roles

  // Use users directly, filtering logic removed as API handles it
  const filteredUsers = users;

  const columns = [
    // Columns structure copied from src/app/users/page.js
    {
      header: 'Username',
      accessor: 'username', // Assuming API provides 'username'
      sortable: true,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('username')}
        >
          Username
          {sortField === 'username' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Client name',
      accessor: 'name', // API provides 'name'
      sortable: true,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('name')}
        >
          Client name
          {sortField === 'name' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Email Address',
      accessor: 'email', // API provides 'email'
      sortable: true,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('email')}
        >
          Email Address
          {sortField === 'email' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Date Created',
      accessor: 'created_at', // Assuming API provides 'created_at'
      sortable: true,
      cell: (value) => formatDate(value), // Use formatDate helper
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('created_at')}
        >
          Date Created
          {sortField === 'created_at' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Roles',
      accessor: 'roles', // Assuming API provides 'roles' array
      cell: (value, row, rowIndex) => {
        // Use getRoleStyles helper
        const role = Array.isArray(value) && value.length > 0 ? value[0] : ''; // Assuming first role is primary
        const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'N/A'; // Capitalize

        return (
          <div className="relative">
            <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-center ${getRoleStyles(role)}`}>
              <span className="truncate max-w-[100px] sm:max-w-none">{displayRole}</span>
            </div>
          </div>
        );
      }
      // Note: Sorting by roles might be complex if it's an array. API needs to support it.
      // Add sort handler if API supports sorting by role: onClick={() => handleSort('roles')}
    },
    {
      header: 'Product', // Assuming 'product_count' is available for admin users too
      accessor: 'product_count',
      cell: (value) => value || '0'
      // Add sort handler if API supports sorting by product_count: onClick={() => handleSort('product_count')}
    },
    {
      header: '>',
      accessor: 'id',
      cell: (value, row) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              setSelectedUser(value); // Pass just the ID instead of the full row
              setIsAddModalOpen(true);
            }}
            className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 font-medium border border-gray-300 rounded hover:bg-gray-50"
            aria-label="Edit user"
          >
            Edit
          </button>
          <button
            onClick={async () => { // Make async for potential await inside
              const adminToken = session?.laravelApiToken || getAuthToken(); // Use admin token
              if (adminToken && status === "authenticated") {
                try {
                  setLoading(true); // Indicate loading state
                  setError(null); // Clear previous errors
                  
                  // Always clear any previous impersonation state BEFORE making the API call
                  // This ensures we don't have stale impersonation data that could cause conflicts
                  stopImpersonation(false); // false = don't redirect yet
                  
                  const responseData = await AdminApiService.impersonate(adminToken, value); // Call API

                  // Assuming responseData has { token: '...', user: { id: ..., name: ..., ... } }
                  if (responseData && responseData.token && responseData.user) {
                    // Pass the adminToken used for the API call to startImpersonation
                    const success = startImpersonation(adminToken, responseData.token, responseData.user);
                    if (success) {
                      // Redirect to the root of the app after successful impersonation
                      router.push('/');
                    } else {
                      setError("Failed to initiate impersonation session.");
                    }
                  } else {
                    console.error("Invalid impersonation response structure:", responseData);
                    setError("Received invalid data from server during impersonation.");
                  }
                } catch (error) {
                  console.error("Impersonation failed:", error);
                  setError(error.message || "Failed to impersonate user");
                } finally {
                  setLoading(false); // Stop loading indicator
                }
              } else {
                setError("Admin authentication token not found.");
              }
            }}
            className="text-xs px-2 py-1 text-blue-500 hover:text-blue-700 font-medium border border-blue-300 rounded hover:bg-blue-50"
            aria-label="Impersonate user"
            disabled={loading} // Disable button while loading
          >
            {loading ? 'Logging in...' : 'Login As'}
          </button>
        </div>
      ),
      headerCell: () => (
        <div className="text-center">
          Actions
        </div>
      )
    }
  ];

  const renderPagination = () => {
    // Copied from reference, includes setting loading state
    const pages = [];
    // Logic to determine pages to display (same as reference)
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return (
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          disabled={currentPage === 1 || loading}
          onClick={() => {
            setLoading(true); // Set loading on click
            setCurrentPage(currentPage - 1);
          }}
          className={`px-2 py-1 text-gray-500 ${loading ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'}`}
        >
          Previous
        </button>
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => {
              if (typeof page === 'number' && page !== currentPage) {
                setLoading(true); // Set loading on click
                setCurrentPage(page);
              }
            }}
            className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-gray-200 font-semibold' : 'text-gray-500'} ${page === '...' ? 'cursor-default' : 'hover:bg-gray-100'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={page === '...' || loading}
          >
            {page}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages || loading}
          onClick={() => {
            setLoading(true); // Set loading on click
            setCurrentPage(currentPage + 1);
          }}
          className={`px-2 py-1 text-gray-500 ${loading ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'}`}
        >
          Next
        </button>
      </div>
    );
  };


  // Removed separate loading/error return blocks. Handled within main return.

  return (
    // Use relative positioning for filter panel placement
    <div className="relative container mx-auto px-4 py-8">
      <TableToolbar
        title="Users" // Updated title
        subtitle="All"
        search={{ // Matched structure from reference
          searchTerm,
          onSearch: (value) => {
            setSearchTerm(value);
            // Reset page only if search term is cleared, handled in useEffect
            // if (!value) {
            //   setCurrentPage(1);
            // }
          },
          results: searchResults, // Use 'results' key
          loading: searchLoading,
          onShowAllResults: handleShowAllResults, // Use handler
          totalCount: totalSearchCount,
          renderResult: (user) => (
            <div key={user.id}>
              {user.name} ({user.email})
            </div>
          )
          // Removed userDetailPath, handled in column
        }}
        // addNew={{ // Added addNew prop
        //   onClick: () => {
        //     setSelectedUser(null);
        //     setIsAddModalOpen(true);
        //   },
        //   label: 'Add User'
        // }}
      />


      {/* Display error message if exists */}
      {error && (
        <div className="my-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
          Error: {error}
        </div>
      )}

      {/* Table now handles loading state internally */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
         <Table
          columns={columns}
          data={filteredUsers} // Use filteredUsers (currently same as users)
          loading={loading} // Pass loading state to Table
        />
      </div>

      {/* Render pagination if more than one page, has items, and not loading */}
      {!loading && totalPages > 1 && users.length > 0 && renderPagination()}

      {/* Add User Modal - Added */}
      <UserAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        user={selectedUser}
        onSuccess={() => {
          // Refresh the users list after successful addition
          const token = session?.laravelApiToken || getAuthToken();
           if (token && status === "authenticated") {
             // Fetch the current page again to show the new user
             fetchUsers(token, currentPage, searchTerm, sortField, sortDirection);
           }
        }}
        createFunction={async (userData) => { // Pass the creation handler function
          const token = session?.laravelApiToken || getAuthToken();
          if (!token || status !== "authenticated") {
            // Setting error state here might be redundant if modal handles it,
            // but good for visibility in the page component.
            setError("Authentication required to create user.");
            throw new Error("Authentication required"); // Ensure modal knows creation failed
          }
          // Let errors from createUser propagate up to the modal's catch block
          await AdminApiService.createUser(token, userData);
        }}
        updateFunction={async (userId, userData) => {
          const token = session?.laravelApiToken || getAuthToken();
          if (!token || status !== "authenticated") {
            setError("Authentication required to update user.");
            throw new Error("Authentication required");
          }
          await AdminApiService.updateUser(token, userId, userData);
        }}
      />

      {/* Delete User Modal - Add if needed */}
      {/* <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={userToDelete}
        onConfirmDelete={() => {
          // Handle delete logic using adminApiService and token
          // Refresh list on success
        }}
      /> */}
    </div>
  );
}