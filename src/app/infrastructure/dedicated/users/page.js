'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import Table from '@/components/table/Table';
import TableToolbar from '@/components/table/TableToolbar';
import FilterPanel from '@/components/table/FilterPanel';
import UserAddModal from '@/components/user/UserAddModal';
import DeleteUserModal from '@/components/user/DeleteUserModal';
import ApiService from '@/services/apiService';

export default function DedicatedUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('');
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
  
  const filterButtonRef = useRef(null);

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, sortField, sortDirection, activeFilters);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchUsers(searchTerm);
      } else {
        setSearchResults([]);
        fetchUsers(currentPage, searchTerm, sortField, sortDirection, activeFilters);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage, sortField, sortDirection, activeFilters]);

  const fetchUsers = async (page, search, sort, direction, filters) => {
    try {
      setLoading(true);
      const params = {};
      if (page > 1) params.page = page;
      if (search) params['filter[search]'] = search;
      if (sort) {
        params.sort = direction === 'desc' ? `-${sort}` : sort;
      }
      
      if (filters.dateFrom) {
        params['filter[created_from]'] = filters.dateFrom;
      }
      if (filters.dateTo) {
        params['filter[created_to]'] = filters.dateTo;
      }
      
      if (filters.role) {
        params['filter[role]'] = filters.role;
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const data = await ApiService.getUsersByServerType('dedicated', params);
      setUsers(data.data);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      console.error('Error fetching dedicated server users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (search) => {
    try {
      setSearchLoading(true);
      const params = {
        'filter[search]': search,
        limit: 5
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = await ApiService.getUsersByServerType('dedicated', params);
      setSearchResults(data.data);
      setTotalSearchCount(data.meta.total || data.data.length);
    } catch (error) {
      console.error('Error searching dedicated server users:', error);
      setSearchResults([]);
      setTotalSearchCount(0);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSort = (field) => {
    setLoading(true);
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getShortName = (fullName) => {
    if (!fullName) return '';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0];
    return `${names[0]} ${names[names.length - 1].charAt(0)}.`;
  };

  const availableRoles = ['Partner', 'User'];
  const roleOptions = availableRoles;

  const columns = [
    { 
      header: 'User', 
      accessor: 'username',
      sortable: true,
      headerCell: () => (
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => handleSort('username')}
        >
          User
          {sortField === 'username' && (
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
      header: 'Date Created', 
      accessor: 'created_at',
      sortable: true,
      cell: (value) => formatDate(value),
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
      accessor: 'roles',
      cell: (value, row, rowIndex) => {
        const role = Array.isArray(value) && value.length > 0 ? value[0] : '';
        const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
        
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
    },
    {
      header: '>', 
      accessor: 'id',
      cell: (value, row) => (
        <div className="flex justify-center">
          <button 
            onClick={() => router.push(`/users/${value}`)}
            className="text-gray-500 hover:text-gray-700 font-bold"
            aria-label="View user details"
          >
            {'>'}
          </button>
        </div>
      ),
      headerCell: () => (
        <div className="text-center">
          {'>'}
        </div>
      )
    }
  ];

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
          {'<'}
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
          {'>'}
        </button>
      </div>
    );
  };

  return (
    <div className="relative">
      <TableToolbar 
        title="Users"
        subtitle="Dedicated Servers"
        search={{
          searchTerm,
          onSearch: (value) => {
            setSearchTerm(value);
            if (!value) {
              setCurrentPage(1);
            }
          },
          results: searchResults,
          loading: searchLoading,
          onShowAllResults: handleShowAllResults,
          totalCount: totalSearchCount
        }}
        filter={{
          onClick: () => setIsFilterPanelOpen(!isFilterPanelOpen),
          isActive: filtersActive,
          buttonRef: filterButtonRef
        }}
        addNew={{
          onClick: () => setIsAddModalOpen(true),
          label: 'Add User'
        }}
      />
      
      <FilterPanel 
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={activeFilters}
        onApplyFilters={handleApplyFilters}
        roleOptions={roleOptions}
        buttonRef={filterButtonRef}
      />
      
      <Table 
        columns={columns}
        data={users}
        loading={loading}
      />
      
      {renderPagination()}
      
      <UserAddModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchUsers(currentPage, searchTerm, sortField, sortDirection, activeFilters);
        }}
      />
      
    </div>
  );
}
