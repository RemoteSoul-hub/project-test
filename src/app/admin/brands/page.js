'use client'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";

import Table from '@/components/table/Table';
import TableToolbar from '@/components/table/TableToolbar';
import AdminApiService from '@/services/adminApiService';
import { getAuthToken } from '@/services/AuthService';
import BrandAddModal from '@/components/brand/BrandAddModal';

export default function AdminBrandsPage() {
  const { data: session, status } = useSession();
  const [brands, setBrands] = useState([]);
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  useEffect(() => {
    const token = session?.laravelApiToken;
    if (token && status === "authenticated") {
      fetchBrands(token, currentPage, searchTerm, sortField, sortDirection);
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
          searchBrands(token, searchTerm);
        } else {
          setSearchResults([]);
          fetchBrands(token, currentPage, searchTerm, sortField, sortDirection);
        }
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, currentPage, sortField, sortDirection, session, status]);

  const fetchBrands = async (token, page, search, sort, direction) => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (page > 1) params.page = page;
      if (search) params['filter[search]'] = search;
      if (sort) {
        params.sort = direction === 'desc' ? `-${sort}` : sort;
      }

      const data = await AdminApiService.getBrands(token, params);
      setBrands(data.data);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setError(error.message || "Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  };

  const searchBrands = async (token, search) => {
    try {
      setSearchLoading(true);
      const params = {
        'filter[search]': search,
        limit: 5
      };

      const data = await AdminApiService.getBrands(token, params);
      setSearchResults(data.data);
      setTotalSearchCount(data.meta?.total || data.data?.length || 0);
    } catch (error) {
      console.error('Error searching brands:', error);
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
      fetchBrands(token, 1, searchTerm, sortField, sortDirection);
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
      header: 'Name',
      accessor: 'name',
      sortable: true,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('name')}
        >
          Name
          {sortField === 'name' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Tax Rate',
      accessor: 'tax_rate',
      sortable: true,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('tax_rate')}
        >
          Tax Rate
          {sortField === 'tax_rate' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Billing Email',
      accessor: 'billing_email',
      sortable: true,
      headerCell: () => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleSort('billing_email')}
        >
          Billing Email
          {sortField === 'billing_email' && (
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
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              setSelectedBrand(row);
              setIsAddModalOpen(true);
            }}
            className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 font-medium border border-gray-300 rounded hover:bg-gray-50"
            aria-label="Edit brand"
          >
            Edit
          </button>
          <button
            onClick={async () => {
              if (confirm(`Are you sure you want to delete ${row.name}?`)) {
                try {
                  const token = session?.laravelApiToken || getAuthToken();
                  if (!token || status !== "authenticated") {
                    setError("Authentication required to delete brand.");
                    return;
                  }
                  await AdminApiService.deleteBrand(token, row.id);
                  fetchBrands(token, currentPage, searchTerm, sortField, sortDirection);
                } catch (error) {
                  setError(error.message || "Failed to delete brand");
                }
              }
            }}
            className="text-xs px-2 py-1 text-red-500 hover:text-red-700 font-medium border border-red-300 rounded hover:bg-red-50"
            aria-label="Delete brand"
          >
            Delete
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
    <div className="relative container mx-auto px-4 py-8">
      <TableToolbar
        title="Brands"
        subtitle="All"
        search={{
          searchTerm,
          onSearch: (value) => setSearchTerm(value),
          results: searchResults,
          loading: searchLoading,
          onShowAllResults: handleShowAllResults,
          totalCount: totalSearchCount
        }}
        addNew={{
          onClick: () => {
            setSelectedBrand(null);
            setIsAddModalOpen(true);
          },
          label: 'Add Brand'
        }}
      />

      {error && (
        <div className="my-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
          Error: {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={brands}
          loading={loading}
        />
      </div>

      {!loading && totalPages > 1 && brands.length > 0 && renderPagination()}

      <BrandAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        brand={selectedBrand}
        onSuccess={() => {
          const token = session?.laravelApiToken || getAuthToken();
          if (token && status === "authenticated") {
            fetchBrands(token, currentPage, searchTerm, sortField, sortDirection);
          }
        }}
        createFunction={async (brandData) => {
          const token = session?.laravelApiToken || getAuthToken();
          if (!token || status !== "authenticated") {
            setError("Authentication required to create brand.");
            throw new Error("Authentication required");
          }
          await AdminApiService.createBrand(token, brandData);
        }}
        updateFunction={async (brandId, brandData) => {
          const token = session?.laravelApiToken || getAuthToken();
          if (!token || status !== "authenticated") {
            setError("Authentication required to update brand.");
            throw new Error("Authentication required");
          }
          await AdminApiService.updateBrand(token, brandId, brandData);
        }}
      />
    </div>
  );
}
