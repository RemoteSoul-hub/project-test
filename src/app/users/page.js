'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link

import Table from '@/components/table/Table';
import TableToolbar from '@/components/table/TableToolbar';
import FilterPanel from '@/components/table/FilterPanel';
import UserAddModal from '@/components/user/UserAddModal';
import DeleteUserModal from '@/components/user/DeleteUserModal';
import { Pencil, FileText, Monitor, Mail, Trash2 } from 'lucide-react';
import ApiService from '@/services/apiService';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('login_username');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalSearchCount, setTotalSearchCount] = useState(0);
  const [filtersActive, setFiltersActive] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    dateFrom: '',
    dateTo: '',
    role: ''
  });
  
  // Reference to the filter button
  const filterButtonRef = useRef(null);
  // Ref to track previous search term for pagination reset
  const prevSearchTermRef = useRef(searchTerm);

  // Combined useEffect for fetching data based on all relevant state changes
  useEffect(() => {
    // Check if search term changed compared to the previous render
    const searchTermChanged = prevSearchTermRef.current !== searchTerm;

    // If search term changed, reset to page 1
    if (searchTermChanged && currentPage !== 1) {
      setCurrentPage(1);
      // Update the ref *after* setting the state
      prevSearchTermRef.current = searchTerm;
      // Don't fetch yet, let the effect run again due to currentPage change
      return;
    }

    // Update the ref if it didn't change page
     prevSearchTermRef.current = searchTerm;

    // Debounce the actual fetch calls
    const delayDebounceFn = setTimeout(() => {
      // Fetch main table data
      fetchUsers(currentPage, searchTerm, sortField, sortDirection, activeFilters);

      // Also update dropdown suggestions if search term exists
      if (searchTerm) {
        searchUsersForDropdown(searchTerm); // Use the renamed function
      } else {
        setSearchResults([]); // Clear dropdown if search is empty
        setTotalSearchCount(0);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage, sortField, sortDirection, activeFilters]); // Combined dependencies

  const fetchUsers = async (page, search, sort, direction, filters) => {
    try {
      setLoading(true);
      const params = {};
      if (page > 1) params.page = page;
      if (search) params['filter[search]'] = search;
      if (sort) {
        params.sort = direction === 'desc' ? `-${sort}` : sort;
      }
      
      // Add date filters
      if (filters.dateFrom) {
        params['filter[created_from]'] = filters.dateFrom;
      }
      if (filters.dateTo) {
        params['filter[created_to]'] = filters.dateTo;
      }
      
      // Add role filter
      if (filters.role) {
        params['filter[role]'] = filters.role;
      }
      
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const data = await ApiService.get('/users', params);
      setUsers(data.data);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Renamed function specifically for fetching dropdown suggestions
  const searchUsersForDropdown = async (search) => {
    try {
      setSearchLoading(true);
      const params = {
        'filter[search]': search,
        limit: 5 // Limit search results in dropdown
      };
      
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = await ApiService.get('/users', params);
      setSearchResults(data.data);
      setTotalSearchCount(data.meta.total || data.data.length);
    } catch (error) {
      console.error('Error searching users for dropdown:', error);
      setSearchResults([]);
      setTotalSearchCount(0);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSort = (field) => {
    setLoading(true);
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleShowAllResults = () => {
    setLoading(true);
    fetchUsers(1, searchTerm, sortField, sortDirection, activeFilters);
  };
  
  const handleApplyFilters = (filters) => {
    setLoading(true);
    setActiveFilters(filters);
    setFiltersActive(
      Boolean(filters.dateFrom || filters.dateTo || filters.role)
    );
  };

  // Styling for roles
  const getRoleStyles = (role) => {
    switch (role && role.toLowerCase()) {
      case 'partner':
        return 'bg-blue-100 text-blue-600';
      case 'user':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Format date parts (DD/MM/YYYY and HH:MM:SS)
  const formatDateParts = (dateString) => {
    if (!dateString) return { datePart: '', timePart: '' };
    const date = new Date(dateString);
    const datePart = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    const timePart = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    return { datePart, timePart };
  };

  // Get first name and last initial
  const getShortName = (fullName) => {
    if (!fullName) return '';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0];
    return `${names[0]} ${names[names.length - 1].charAt(0)}.`;
  };

  // Static role options
  const availableRoles = ['Partner', 'User'];
  
  // Define filter fields for the FilterPanel
  const filterFields = [
    { 
      name: 'dateFrom', 
      label: 'Created Date From', 
      type: 'date', 
      placeholder: 'Start Date' 
    },
    { 
      name: 'dateTo', 
      label: 'Created Date To', 
      type: 'date', 
      placeholder: 'End Date' 
    },
    { 
      name: 'role', 
      label: 'Role', 
      type: 'select', 
      placeholder: 'Select Role', 
      options: availableRoles.map(role => ({ value: role.toLowerCase(), label: role })) 
    }
  ];

  const filteredUsers = users;

  const columns = [
    { 
      header: 'User', 
      accessor: 'login_username',
      sortable: true,
      cell: (value, row) => ( // Add cell renderer for username Link
        <Link href={`/users/${row.id}`} className="text-blue-600 hover:underline">
          {value || row.username}
        </Link>
      ),
      headerCell: () => (
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => handleSort('login_username')}
        >
          User
          {sortField === 'login_username' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    { 
      header: 'Date Created',
      accessor: 'created_at',
      sortable: true,
      cell: (value) => {
        const { datePart, timePart } = formatDateParts(value);
        return (
          <div>
            <div>{datePart}</div>
            <div className="text-xs text-gray-500">{timePart}</div>
          </div>
        );
      },
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
      header: 'Client name', 
      accessor: 'name',
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
      accessor: 'email',
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
      header: 'Roles', 
      accessor: 'roles',
      cell: (value, row, rowIndex) => {
        // Get the first role or default to empty
        const role = Array.isArray(value) && value.length > 0 ? value[0] : '';
        const displayRole = role.charAt(0).toUpperCase() + role.slice(1); // Capitalize first letter
        
        return (
          <div className="relative">
            <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-center ${getRoleStyles(role)}`}>
              <span className="truncate max-w-[100px] sm:max-w-none">{displayRole}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Product',
      accessor: 'servers', // Updated accessor to use 'servers' from API
      cell: (value) => value || '0'
    }
    // Removed the actions column ('>')
  ];

  // Dropdown actions removed as per requirement

  const renderPagination = () => {
    const pages = [];
    const links = [];

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
            setLoading(true);
            setCurrentPage(currentPage - 1);
          }}
          className={`px-2 py-1 text-gray-500 ${loading ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'}`}
        >
          &lt;
        </button>
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => {
              if (typeof page === 'number' && page !== currentPage) {
                setLoading(true);
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
            setLoading(true);
            setCurrentPage(currentPage + 1);
          }}
          className={`px-2 py-1 text-gray-500 ${loading ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'}`}
        >
          &gt;
        </button>
      </div>
    );
  };

  // Handle downloads with different formats
  const handleDownloadXLSX = async () => {
    try {
      
      // Use the new downloadExportFile function
      const blob = await ApiService.downloadExportFile('/users/export', { format: 'xls' }, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      
      // Create a temporary link element
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      
      // Trigger the download
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading XLSX:', error);
      // Show error notification if needed
    }
  };

  const handleDownloadCSV = async () => {
    try {
      
       // Use the new downloadExportFile function
      const blob = await ApiService.downloadExportFile('/users/export', { format: 'csv' }, 'text/csv');
      
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      
      // Create a temporary link element
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      
      // Trigger the download
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      // Show error notification if needed
    }
  };

  // Available role options for the filter - use the same static list
  const roleOptions = availableRoles;

  // Function to render each search result in the dropdown
  const renderSearchResult = (user) => (
    <div>
      <div className="font-medium">{user.name || user.login_username || user.username}</div>
      <div className="text-sm text-gray-500">{user.email}</div>
    </div>
  );

  // Function to handle click on a search result item
  const handleResultClick = (user) => {
    if (user && user.id) {
      router.push(`/users/${user.id}`);
    }
  };

  return (
    <div className="relative">
      <TableToolbar
        title="Users"
        subtitle="All"
        search={{
          searchTerm,
          onSearch: (value) => {
            setSearchTerm(value);
            if (!value) {
              setCurrentPage(1); // Reset to first page when clearing search
            }
          },
          results: searchResults,
          loading: searchLoading,
          onShowAllResults: handleShowAllResults,
          totalCount: totalSearchCount,
          renderResult: renderSearchResult, // Pass the rendering function
          onResultClick: handleResultClick // Pass the click handler
        }}
        filter={{
          onClick: () => setIsFilterPanelOpen(!isFilterPanelOpen),
          isActive: filtersActive,
          buttonRef: filterButtonRef
        }}
        download={{
          onDownloadXLSX: handleDownloadXLSX,
          onDownloadCSV: handleDownloadCSV
        }}
        addNew={{
          onClick: () => setIsAddModalOpen(true),
          label: 'Add User'
        }}
      />
      
      {/* Filter Panel */}
      <FilterPanel 
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={activeFilters}
        onApplyFilters={handleApplyFilters}
        filterFields={filterFields} // Pass the defined fields
        buttonRef={filterButtonRef}
      />
      
      <Table 
        columns={columns}
        data={filteredUsers}
        loading={loading}
      />
      
      {renderPagination()}
      
      {/* Add User Modal */}
      <UserAddModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Refresh the users list after successful addition
          fetchUsers(currentPage, searchTerm, sortField, sortDirection, activeFilters);
        }}
      />
      
    </div>
  );
}
