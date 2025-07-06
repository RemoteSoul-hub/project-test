'use client';
import { useState, useEffect } from 'react';
import Table from '@/components/table/Table';
import SearchBar from '@/components/table/SearchBar';
import FilterButton from '@/components/table/FilterButton';
import { Play, Square, RefreshCw } from 'lucide-react';

// Skip static generation for this page
export const dynamic = 'force-dynamic';

// Create a separate component for the client-side content
function InfrastructureContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isClient, setIsClient] = useState(false);

  // This effect will only run on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Only define mockData on the client side
  const mockData = isClient ? [
    {
      id: 1,
      user: 'FXBO',
      label: 'Data Management Server',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 2,
      user: 'Lino G.',
      label: 'Server 123',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 3,
      user: 'Dom G.',
      label: 'Server 123',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 4,
      user: 'Lino G. 1',
      label: 'Content Delivery System',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 5,
      user: 'FXBO',
      label: 'Live Trading Server',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 6,
      user: 'FXBO',
      label: 'Data Management Server',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 7,
      user: 'Lino G.',
      label: 'Server 123',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 8,
      user: 'Dom G.',
      label: 'Server 123',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 9,
      user: 'Lino G.',
      label: 'Content Delivery System',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 10,
      user: 'FXBO',
      label: 'Live Trading Server',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 11,
      user: 'FXBO',
      label: 'Data Management Server',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 12,
      user: 'Lino G.',
      label: 'Server 123',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 13,
      user: 'Dom G.',
      label: 'Server 123',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 14,
      user: 'Lino G.',
      label: 'Content Delivery System',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 15,
      user: 'FXBO',
      label: 'Live Trading Server',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 16,
      user: 'FXBO',
      label: 'Data Management Server',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 17,
      user: 'Lino G.',
      label: 'Server 123',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 18,
      user: 'Dom G.',
      label: 'Server 123',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 19,
      user: 'Lino G.',
      label: 'Content Delivery System',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 20,
      user: 'FXBO',
      label: 'Live Trading Server',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 21,
      user: 'FXBO',
      label: 'Data Management Server',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 22,
      user: 'Lino G.',
      label: 'Server 123',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 23,
      user: 'Dom G.',
      label: 'Server 123',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 24,
      user: 'Lino G.',
      label: 'Content Delivery System',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    },
    {
      id: 25,
      user: 'FXBO',
      label: 'Live Trading Server',
      cpu: {
        count: '1× AMD Ryzen 9 7900',
        details: '12 Cores, 24 Threads, 3.7 GHz'
      },
      ram: '32GB',
      storage: {
        size: '2 × 3.84TB',
        type: 'NVMe SSD'
      },
      location: 'Amsterdam, NL',
      status: 'Online'
    }
  ] : [];

  // Ensure mockData is defined before filtering
  const filteredData = mockData.filter(server =>
    server.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      header: 'User',
      accessor: 'user',
    },
    {
      header: 'Label',
      accessor: 'label',
    },
    {
      header: 'CPU',
      accessor: 'cpu',
      cell: (value) => {
        if (!value) return null;
        return (
          <div>
            <div>{value.count}</div>
            <div className="text-sm text-gray-500">{value.details}</div>
          </div>
        );
      },
    },
    {
      header: 'RAM',
      accessor: 'ram',
    },
    {
      header: 'Storage',
      accessor: 'storage',
      cell: (value) => {
        if (!value) return null;
        return (
          <div>
            <div>{value.size}</div>
            <div className="text-sm text-gray-500">{value.type}</div>
          </div>
        );
      },
    },
    {
      header: 'Location',
      accessor: 'location',
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value) => {
        if (!value) return null;
        return (
          <div className="flex items-center">
            <span className="w-2 h-2 mr-2 rounded-full bg-green-500"></span>
            {value}
          </div>
        );
      },
    },
    {
      header: '',
      accessor: 'actions',
      className: 'text-right',
      cell: () => (
        <div className="flex gap-2 justify-end">
          <button className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800">Start</button>
          <button className="px-2 py-1 text-sm text-red-600 hover:text-red-800">Stop</button>
          <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800">Reinstall</button>
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: 'Start',
      icon: <Play size={16} className="mr-2" />,
      onClick: () => console.log('Start clicked'),
    },
    {
      label: 'Stop',
      icon: <Square size={16} className="mr-2" />,
      onClick: () => console.log('Stop clicked'),
    },
    {
      label: 'Reinstall',
      icon: <RefreshCw size={16} className="mr-2" />,
      onClick: () => console.log('Reinstall clicked'),
    },
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
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="px-2 py-1 text-gray-500 disabled:opacity-50"
        >
          &lt;
        </button>
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && setCurrentPage(page)}
            className={`px-3 py-1 rounded-md ${
              currentPage === page ? 'bg-gray-200 font-semibold' : 'text-gray-500'
            } ${page === '...' ? 'cursor-default' : 'hover:bg-gray-100'}`}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="px-2 py-1 text-gray-500 disabled:opacity-50"
        >
          &gt;
        </button>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Infrastructure</h1>
        <div className="flex gap-4 items-center">
          <SearchBar onSearch={handleSearch} />
          <FilterButton />
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Add New
          </button>
        </div>
      </div>
      
      {isClient ? (
        <>
          <Table 
            data={paginatedData} 
            columns={columns}
            dropdownActions={actions}
            loading={!isClient}
          />
          {renderPagination()}
        </>
      ) : (
        <div className="p-6 text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}
    </div>
  );
}

// Main page component that uses dynamic import for client-side rendering
export default function Infrastructure() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  return <InfrastructureContent />;
}
