'use client'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUserPlus, FaUserEdit, FaUser } from 'react-icons/fa';
import { use } from 'react';

import Table from '@/components/table/Table';
import Pagination from '@/components/table/Pagination';
import TableToolbar from '@/components/table/TableToolbar';
import AdminApiService from '@/services/adminApiService';
import { startImpersonation } from '@/services/AuthService';
import { FaEdit } from 'react-icons/fa';

export default function PartnerUsersPage({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const partnerId = use(params).id;

  // Items per page
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = session?.laravelApiToken;
        if (!token) throw new Error('No authentication token available');

        // Prepare API parameters
        const params = {
          page: currentPage,
          per_page: pageSize,
          sort: `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.key}`
        };

        // Add search term if present
        if (searchTerm) {
          params['filter[search]'] = searchTerm;
        }

        const data = await AdminApiService.getPartnerUsers(token, partnerId, params);
        setUsers(data.data || []);
        setTotalPages(data.meta?.last_page || 1);
        setTotalItems(data.meta?.total || 0);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUsers();
    }
  }, [session, partnerId, currentPage, pageSize, sortConfig, searchTerm]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleImpersonate = async (userId) => {
    try {
      setLoading(true);
      const token = session?.laravelApiToken;
      if (!token) throw new Error('No authentication token available');

      const response = await AdminApiService.impersonateUser(token, userId);
      
      // Start impersonation session using AuthService
      if (response.token && response.user) {
        const success = startImpersonation(token, response.token, response.user);
        if (!success) {
          throw new Error('Failed to start impersonation session');
        }
      }
      
      // Redirect to the main app
      window.location.href = process.env.NEXT_PUBLIC_APP_URL || '/';
    } catch (error) {
      console.error('Error impersonating user:', error);
      setError(error.message || 'Failed to impersonate user');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      cell: (value) => value,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('name')}
        >
          Name
          {sortConfig.key === 'name' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Email',
      accessor: 'email',
      sortable: true,
      cell: (value) => value,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('email')}
        >
          Email
          {sortConfig.key === 'email' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      sortable: true,
      cell: (value) => value,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('role')}
        >
          Role
          {sortConfig.key === 'role' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (value, row) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => router.push(`/admin/partners/${partnerId}/users/${row.id}/edit`)}
            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
            title="Edit User"
          >
            <FaEdit /> Edit
          </button>
          <button
            onClick={() => handleImpersonate(row.id)}
            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
            title="Login as this user"
          >
            Login As
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Partner Users</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/partners/${params.id}/users/create`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FaUserPlus /> Add User
          </button>
          <button
            onClick={() => router.push(`/admin/partners`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <FaUser /> Back to Partners
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <TableToolbar
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          searchLoading={loading}
        />

        {error && (
          <div className="p-4 text-red-600 bg-red-50">
            {error}
          </div>
        )}

        <Table
          columns={columns}
          data={users}
          loading={loading}
        />

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
