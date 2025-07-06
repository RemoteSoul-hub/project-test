'use client'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link component

import Table from '@/components/table/Table';
import TableToolbar from '@/components/table/TableToolbar';
import AdminApiService from '@/services/adminApiService'; // Updated path
import InvoiceCreateModal from '@/components/invoices/InvoiceCreateModal';

export default function AdminInvoicesPage() {
  const router = useRouter();
  const { data: session, status } = useSession(); // Keep session for token
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Keep error state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Initial data load
  useEffect(() => {
    const token = session?.laravelApiToken;
    if (token && status === "authenticated") {
      fetchInvoices(token, currentPage);
    } else if (status === "loading") {
      // Optionally handle loading state for session
      setLoading(true);
    } else {
      // Handle unauthenticated state if necessary, e.g., redirect or show message
      setLoading(false);
      setError("Authentication required.");
    }
  }, [session, status, currentPage]); // Depend only on session and status for initial load trigger

  const fetchInvoices = async (token, page) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const params = {};
      if (page > 1) params.page = page;

      // Use static AdminApiService method
      const data = await AdminApiService.getInvoices(token, params); // Pass token

      setInvoices(data.data);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      console.error('Error fetching admin invoices:', error);
      setError(error.message || "Failed to fetch invoices"); // Set error state
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Ensure valid date before formatting
    if (isNaN(date.getTime())) return 'Invalid Date';
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      cell: (value, row) => (
        <Link href={`/admin/invoices/${value}`} className="text-blue-600 hover:underline">
          {value}
        </Link>
      ),
    },
    {
      header: 'Is Paid',
      accessor: 'is_paid',
      cell: (value) => (value ? 'Yes' : 'No'),
    },
    {
      header: 'Net Amount',
      accessor: 'net_amount',
    },
    {
      header: 'Total',
      accessor: 'total',
    },
    {
      header: 'Brand Name',
      accessor: 'brand_name',
    },
    {
      header: 'Start Date',
      accessor: 'start_date',
      cell: (value) => formatDate(value),
    },
    {
      header: 'End Date',
      accessor: 'end_date',
      cell: (value) => formatDate(value),
    },
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
          
        </button>
      </div>
    );
  };

  return (
    // Use relative positioning for filter panel placement
    <div className="relative container mx-auto px-4 py-8">
      <TableToolbar
        title="Invoices"
        subtitle="All"
        addNew={{
          onClick: () => setIsCreateModalOpen(true),
          label: 'Create Invoice',
        }}
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
          data={invoices} // Use invoices
          loading={loading} // Pass loading state to Table
        />
      </div>

      {/* Render pagination if more than one page and not loading */}
      {!loading && totalPages > 1 && renderPagination()}
      <InvoiceCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
