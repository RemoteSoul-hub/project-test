'use client';

import { useState } from 'react';
import Table from '@/components/table/Table';
import { Download, Search } from 'lucide-react';

export default function ApiLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for API logs
  const logData = [
    {
      id: 1,
      date: '01/01/2025 10:38:06',
      ip_address: '194.194.119.8',
      api_call: '/api/v2/1901/vps/add',
      params: '{"params":{"language":"ja-jp","request id":"fa1a52e5-26d7-46ab-bfe0-c9aa6a48f7ee","configuration":"win-std-..."}}',
    },
    {
      id: 2,
      date: '01/01/2025 10:38:06',
      ip_address: '194.194.119.8',
      api_call: '/api/v2/1901/vps/add',
      params: '{"params":{"language":"ja-jp","request id":"fa1a52e5-26d7-46ab-bfe0-c9aa6a48f7ee","configuration":"win-std-..."}}',
    },
    {
      id: 3,
      date: '01/01/2025 10:38:06',
      ip_address: '194.194.119.8',
      api_call: '/api/v2/1901/vps/add',
      params: '{"params":{"language":"ja-jp","request id":"fa1a52e5-26d7-46ab-bfe0-c9aa6a48f7ee","configuration":"win-std-..."}}',
    },
    {
      id: 4,
      date: '01/01/2025 10:38:06',
      ip_address: '194.194.119.8',
      api_call: '/api/v2/1901/vps/add',
      params: '{"params":{"language":"ja-jp","request id":"fa1a52e5-26d7-46ab-bfe0-c9aa6a48f7ee","configuration":"win-std-..."}}',
    },
    {
      id: 5,
      date: '01/01/2025 10:38:06',
      ip_address: '194.194.119.8',
      api_call: '/api/v2/1901/vps/add',
      params: '{"params":{"language":"ja-jp","request id":"fa1a52e5-26d7-46ab-bfe0-c9aa6a48f7ee","configuration":"win-std-..."}}',
    },
  ];

  const columns = [
    { 
      accessor: 'date', 
      header: 'Date',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Date
        </div>
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
          {value}
        </div>
      )
    },
  ];

  // Generate page numbers for pagination
  const totalPages = 10; // Example total pages
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
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
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">API Logs</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="pl-4 pr-10 py-2 border rounded-lg w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute right-3 top-2.5 text-gray-400">
                <Search size={20} />
              </span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50">
              <Download size={16} />
              Download
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border shadow-sm">
          <Table columns={columns} data={logData} />
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-6 gap-1">
          <button 
            className="px-3 py-1 border rounded-md text-sm bg-white disabled:opacity-50"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            &lt;
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
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
} 