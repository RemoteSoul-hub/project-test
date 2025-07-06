'use client'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUserPlus, FaUserEdit, FaUsers } from 'react-icons/fa';

import Table from '@/components/table/Table';
import TableToolbar from '@/components/table/TableToolbar';
import FilterPanel from '@/components/table/FilterPanel';
import AdminApiService from '@/services/adminApiService';
import { getAuthToken } from '@/services/AuthService';

export default function AdminPartnersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalSearchCount, setTotalSearchCount] = useState(0);

  useEffect(() => {
    const token = session?.laravelApiToken;
    if (token && status === "authenticated") {
      fetchPartners(token, currentPage, searchTerm, sortField, sortDirection);
    } else if (status === "loading") {
      setLoading(true);
    } else {
      setLoading(false);
      setError("Authentication required.");
    }
  }, [session, status]);

  useEffect(() => {
    const token = session?.laravelApiToken || getAuthToken();
    if (token && status === "authenticated") {
      const delayDebounceFn = setTimeout(() => {
        if (searchTerm) {
          searchPartners(token, searchTerm);
        } else {
          setSearchResults([]);
          fetchPartners(token, currentPage, searchTerm, sortField, sortDirection);
        }
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, currentPage, sortField, sortDirection, session, status]);

  const fetchPartners = async (token, page, search, sort, direction) => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (page > 1) params.page = page;
      if (search) params['filter[search]'] = search;
      if (sort) {
        params.sort = direction === 'desc' ? `-${sort}` : sort;
      }

      const data = await AdminApiService.getPartners(token, params);
      setPartners(data.data);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      console.error('Error fetching partners:', error);
      setError(error.message || "Failed to fetch partners");
    } finally {
      setLoading(false);
    }
  };

  const searchPartners = async (token, search) => {
    try {
      setSearchLoading(true);
      const params = {
        'filter[search]': search,
        limit: 5
      };

      const data = await AdminApiService.getPartners(token, params);
      setSearchResults(data.data);
      setTotalSearchCount(data.meta?.total || data.data?.length || 0);
    } catch (error) {
      console.error('Error searching partners:', error);
      setSearchResults([]);
      setTotalSearchCount(0);
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
    const token = session?.laravelApiToken || getAuthToken();
    if (token && status === "authenticated") {
      setLoading(true);
      setCurrentPage(1);
      fetchPartners(token, 1, searchTerm, sortField, sortDirection);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const columns = [
    {
      header: 'Company Name',
      accessor: 'company_name',
      sortable: true,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('company_name')}
        >
          Company Name
          {sortField === 'company_name' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Phone Number',
      accessor: 'phone_number',
      sortable: true,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('phone_number')}
        >
          Phone Number
          {sortField === 'phone_number' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'VAT Number',
      accessor: 'vat_number',
      sortable: true,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('vat_number')}
        >
          VAT Number
          {sortField === 'vat_number' && (
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
      header: 'Actions',
      accessor: 'id',
      cell: (value, row) => (
        <div className="flex justify-center gap-4">
          <Link
            href={`/admin/partners/${row.id}/users`}
            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
            title="View Users"
          >
            <FaUsers size={18} />
          </Link>
          <Link
            href={`/admin/partners/${row.id}/edit`}
            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
            title="Edit Partner"
          >
            <FaUserEdit size={18} />
          </Link>
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
    const pages = [];
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
            className={`px-2 py-1 ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            } ${typeof page !== 'number' ? 'cursor-default' : ''}`}
            disabled={typeof page !== 'number' || loading}
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Partners</h1>
        <Link
          href="/admin/partners/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add New Partner
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <TableToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchLoading={searchLoading}
          searchResults={searchResults}
          totalSearchCount={totalSearchCount}
          onShowAllResults={handleShowAllResults}
        />

        {error && (
          <div className="p-4 text-red-600 bg-red-50">
            {error}
          </div>
        )}

        <Table
          columns={columns}
          data={partners}
          loading={loading}
        />

        {renderPagination()}
      </div>
    </div>
  );
}
