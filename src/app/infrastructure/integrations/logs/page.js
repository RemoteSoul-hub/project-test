'use client';

import { useState, useEffect } from 'react';
import Table from '@/components/table/Table';
import JsonViewer from '@/components/JsonViewer';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react'; // Import ChevronRight
import Link from 'next/link';
import ApiService from '@/services/apiService'; // Import ApiService
import Modal from '@/components/Modal'; // Import Modal component

export default function ApiLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [logData, setLogData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [showLogModal, setShowLogModal] = useState(false); // State for modal visibility
  const [selectedLog, setSelectedLog] = useState(null); // State for selected log data

  // TODO: Dynamically get partnerId from URL or user context
  const partnerId = '1'; // Placeholder partner ID

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          // page: currentPage, // Commented out for testing as per user request
          // search: searchTerm, // Commented out for testing as per user request
          // Add other parameters like per_page, sort, etc. if needed by the API
        };
        const response = await ApiService.getApiLogs(partnerId, params);
        // Assuming the API returns data in a 'data' array and 'meta' for pagination
        setLogData(response.data.map(log => ({
          // Map API fields to table accessors
          date: new Date(log.created_at).toLocaleString(),
          ip_address: log.ip_address,
          api_call: `${log.method} ${log.url}`, // Combine method and url for API Call
          params: log.request && log.request.body ? log.request.body : log.request, // Use request body or full request
          full_log: { // Combine request and response for full_log viewer
            request: log.request,
            response: log.response,
            status_code: log.status_code,
            user_id: log.user_id,
            user_email: log.user_email,
            created_at: log.created_at,
            ip_address: log.ip_address,
            api_key_name: log.api_key_name,
          }
        })));
        setTotalPages(response.meta.last_page || 1); // Adjust based on actual API response structure
      } catch (err) {
        console.error('Failed to fetch API logs:', err);
        setError('Failed to load API logs. Please try again later.');
        setLogData([]); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage, searchTerm, partnerId]);

  const columns = [
    { 
      accessor: 'date', 
      header: 'Date',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Date ↓
        </div>
      ),
      cell: (value) => (
        <div className="whitespace-pre-line">{value}</div>
      )
    },
    { 
      accessor: 'ip_address', 
      header: 'IP Address',
    },
    { 
      accessor: 'api_call', 
      header: 'API Call',
    },
    { 
      accessor: 'params', 
      header: 'Params',
      cell: (value) => (
        <div className="max-w-xl truncate font-mono text-sm">
          {typeof value === 'object' ? JSON.stringify(value) : value}
        </div>
      )
    },
    {
      accessor: 'actions',
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => {
            setSelectedLog(row);
            setShowLogModal(true);
          }}
          className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View Log
        </button>
      )
    }
  ];

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // Number of page buttons to show around current page
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 md:gap-0">
            <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
              <Link href="/infrastructure/integrations" className="hover:text-gray-600">
                <ChevronLeft size={24} />
              </Link>
              <h1 className="text-2xl font-semibold">API Logs</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-4 pr-10 py-2 border rounded-lg w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute right-3 top-2.5 text-gray-400">
                  <Search size={20} />
                </span>
              </div>
              {/* Hidden as per user request */}
              {/* <button className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 w-full sm:w-auto">
                <Download size={16} />
                Download
              </button> */}
            </div>
          </div>

          {loading && <p className="text-center text-gray-600">Loading logs...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}
          {!loading && !error && logData.length === 0 && (
            <p className="text-center text-gray-600">No API logs found.</p>
          )}

          {/* Table */}
          {!loading && !error && logData.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
              <Table 
                columns={columns} 
                data={logData} 
                expandable={true}
                expandedContent={(row) => (
                  <JsonViewer data={row.full_log} />
                )}
              />
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-1">
              <button 
                className="px-3 py-1 border rounded-md text-sm bg-white disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  className={`px-3 py-1 border rounded-md text-sm bg-white ${
                    currentPage === page ? 'bg-gray-100 font-semibold' : ''
                  } ${typeof page === 'string' ? 'cursor-default' : 'hover:bg-gray-50'}`}
                  disabled={typeof page === 'string'}
                >
                  {page}
                </button>
              ))}
              <button 
                className="px-3 py-1 border rounded-md text-sm bg-white disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log Details Modal */}
      <Modal
        show={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="API Log Details"
      >
        {selectedLog && (
          <div className="p-4">
            <JsonViewer data={selectedLog.full_log} />
          </div>
        )}
      </Modal>
    </div>
  );
}
