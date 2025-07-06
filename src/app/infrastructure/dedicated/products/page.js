'use client';

import React, { useState, useEffect, useRef } from 'react'; // Added useEffect, useRef
import Table from '@/components/table/Table';
import ServerCard from '@/components/server/ServerCard';
import { ChevronDown, Pencil, FileText, Monitor, Mail, MoreVertical, Trash2 } from 'lucide-react'; // Removed Filter, Plus. Added MoreVertical, Trash2
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Added Link
import ApiService from '@/services/apiService'; // Added ApiService
import ServerService from '@/services/serverService'; // Added ServerService (assuming needed for actions)
import Pagination from '@/components/table/Pagination'; // Added Pagination
import { createPortal } from 'react-dom'; // Added createPortal for dropdown

const DedicatedProductsPage = () => {
  const router = useRouter();
  const [serverData, setServerData] = useState([]); // State for API data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [totalItems, setTotalItems] = useState(0); // Total items for pagination
  const [openDropdown, setOpenDropdown] = useState(null); // Dropdown state
  const dropdownRefs = useRef({}); // Refs for dropdowns
  const pageSize = 10; // Items per page

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown !== null && !dropdownRefs.current[openDropdown]?.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Define actions for the dropdown menu (will be updated later based on API)
  const actions = [
    {
      label: 'Edit Server',
      icon: <Pencil size={16} className="mr-2" />,
      onClick: (serverId) => {
        router.push(`/infrastructure/dedicated/products/${serverId}`);
      },
    },
    {
      label: 'Invoices',
      icon: <FileText size={16} className="mr-2" />,
      onClick: () => console.log('Invoices clicked'),
    },
    {
      label: 'Login to Server',
      icon: <Monitor size={16} className="mr-2" />,
      onClick: () => console.log('Login to Server clicked'),
    },
    {
      label: 'Email Templates',
      icon: <Mail size={16} className="mr-2" />,
      onClick: () => console.log('Email Templates clicked'), // Placeholder
    },
    // Add Delete action placeholder
    {
      label: 'Delete Server',
      icon: <Trash2 size={16} className="mr-2" />,
      className: "text-red-600",
      onClick: (row) => {
         // Placeholder action
        // Implement delete modal logic here later
      }
    }
  ];

  // REMOVE MOCK DATA - Will be replaced by fetchServers
  // const allServerData = [ ... ];

  // Calculate pagination values - Will be updated based on API response
  const totalPages = Math.ceil(totalItems / pageSize);
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const endIndex = startIndex + itemsPerPage;
  // const currentData = allServerData.slice(startIndex, endIndex);

  // Generate page numbers for pagination - Replaced by Pagination component
  // const getPageNumbers = () => { ... };

  // Handle page change for Pagination component
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Custom DropdownMenu component (similar to VPS page)
  const DropdownMenu = ({ id, row, actions }) => {
    const isOpen = openDropdown === id;
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);

    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: Math.max(10, rect.right - 192)
        });
      }
    }, [isOpen]);

    const handleActionClick = async (action, e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        
        await action.onClick(row); // Execute the action
        // Add notification logic if needed
      } catch (error) {
        console.error(`Error executing ${action.label}:`, error);
        // Add error notification logic if needed
      } finally {
        setOpenDropdown(null);
      }
    };

    // Add isActionDisabled logic if needed based on dedicated server status

    return (
      <div className="relative" ref={el => dropdownRefs.current[id] = el}>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenDropdown(isOpen ? null : id);
          }}
          className="p-2 rounded-full hover:bg-gray-200"
          aria-label="More options"
        >
          <MoreVertical size={18} />
        </button>

        {isOpen && typeof window !== 'undefined' && document.body && createPortal(
          <div
            className="fixed w-48 bg-white rounded-md shadow-lg z-[9999] border"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ul className="py-1">
              {actions.map((action, index) => {
                // const isDisabled = isActionDisabled(action.label, row.status); // Add if needed
                const isDisabled = false; // Placeholder
                return (
                  <li
                    key={index}
                    className={`px-4 py-2 flex items-center ${
                      isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'hover:bg-gray-100 cursor-pointer'
                    } ${action.className || ''}`}
                    onClick={(e) => !isDisabled && handleActionClick(action, e)}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
      </div>
    );
  };

  // Fetch servers function
  const fetchServers = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        'filter[type]': 'dedicated', // Filter for dedicated servers
        'sort': '-created_at',
        page: currentPage,
        per_page: pageSize
      };

      
      const response = await ApiService.get('/servers', queryParams);
      

      if (!response || !response.data) {
        throw new Error('Invalid API response format');
      }

      // Transform data (adjust based on actual dedicated server API response)
      const transformedData = response.data.map(server => ({
        id: server.id,
        user: server.user?.name || server.user?.username || 'Unknown',
        label: server.hostname,
        created: server.created_at, // Keep original for formatting in cell
        cpu: { // Assuming similar structure to VPS
          count: typeof server.cpu_count === 'number' ? server.cpu_count : 'Unknown',
          type: server.cpu_type || 'N/A'
        },
        ram: server.plan?.memory_size, // Keep original for formatting in cell
        storage: server.plan?.disk_size, // Keep original for formatting in cell
        location: server.location?.name || 'Unknown',
        status: 'Online' // Placeholder - Dedicated might have different status logic
      }));

      setServerData(transformedData);
      setTotalItems(response.meta?.total || 0);

    } catch (err) {
      console.error('Error fetching dedicated servers:', err);
      setError(err.message || 'Failed to load dedicated servers');
      setServerData([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect to fetch servers on mount and page change
  useEffect(() => {
    fetchServers();
  }, [currentPage]);


  // Define Table Columns (adjust accessors based on actual API response)
  const columns = [
    {
      accessor: 'user', // Assuming 'user.name' or 'user.username' from API
      header: 'User',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          User <ChevronDown size={16} />
        </div>
      )
    },
    {
      accessor: 'label', // Assuming 'hostname' from API
      header: 'Label',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Label <ChevronDown size={16} />
        </div>
      ),
      cell: (value, row) => ( // Make label clickable
        <Link href={`/infrastructure/dedicated/products/${row.id}`} className="text-blue-600 hover:underline">
          {value}
        </Link>
      )
    },
    {
      accessor: 'created', // Assuming 'created_at' from API
      header: 'Created',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Created <ChevronDown size={16} />
        </div>
      ),
      cell: (value) => new Date(value).toLocaleDateString() // Format date
    },
    {
      accessor: 'cpu', // Assuming 'cpu_type' and 'cpu_count' from API
      header: 'CPU',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          CPU <ChevronDown size={16} />
        </div>
      ),
      cell: (value) => ( // Adjust based on actual API structure
        <div>
          <div>{value?.count} {value?.count === 1 ? 'Core' : 'Cores'}</div>
          <div className="text-sm text-gray-500">{value?.type || 'N/A'}</div>
        </div>
      )
    },
    {
      accessor: 'ram', // Assuming 'plan.memory_size' from API (in MB)
      header: 'RAM',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          RAM <ChevronDown size={16} />
        </div>
      ),
      cell: (value) => typeof value === 'number' ? `${(value / 1024).toFixed(0)} GB` : 'Unknown' // Format RAM
    },
    {
      accessor: 'storage', // Assuming 'plan.disk_size' from API (in GB)
      header: 'Storage',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Storage <ChevronDown size={16} />
        </div>
      ),
      cell: (value) => typeof value === 'number' ? `${value} GB` : 'Unknown' // Format Storage
    },
    {
      accessor: 'location', // Assuming 'location.name' from API
      header: 'Location',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Location <ChevronDown size={16} />
        </div>
      )
    },
    {
      accessor: 'status', // Assuming status comes from API or separate call
      header: 'Status',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Status <ChevronDown size={16} />
        </div>
      ),
      cell: (value) => { // Implement status rendering like VPS page
        let statusColor = 'bg-gray-500';
        let statusText = 'Unknown';
        // Add logic based on actual status values
        if (value === 'Online' || value === 'running') { // Adjust as needed
          statusColor = 'bg-green-500';
          statusText = 'Online';
        } else if (value === 'Offline' || value === 'stopped') {
          statusColor = 'bg-red-500';
          statusText = 'Offline';
        } else if (value === 'Maintenance' || value === 'suspended') {
           statusColor = 'bg-yellow-500';
           statusText = 'Maintenance';
        } else if (value === 'loading') {
           statusColor = 'bg-gray-400';
           statusText = 'Loading...';
        } else {
           statusText = value || 'Unknown';
        }
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
            <span>{statusText}</span>
          </div>
        );
      }
    },
    // Add Actions column
    {
      accessor: 'actions',
      header: 'Actions',
      cell: (value, row) => (
        <DropdownMenu
          id={`dedi-${row.id}`}
          row={row}
          actions={actions}
        />
      )
    }
  ];

  // Loading and Error states
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Dedicated Servers</h1>
        {/* Keep ServerCard */}
        <div className="mb-6">
          <ServerCard
            title="Launch a Dedicated Server"
            description="Our Dedicated Forex Server handles all intense and complex trading strategies. Harness powerful Inter processing power and dedicated resources today!"
            gradient="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800"
            actionButton="Get Started Now"
            opensContactSalesModal={true} // Added prop
          />
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Dedicated Servers</h1>
         {/* Keep ServerCard */}
        <div className="mb-6">
          <ServerCard
            title="Launch a Dedicated Server"
            description="Our Dedicated Forex Server handles all intense and complex trading strategies. Harness powerful Inter processing power and dedicated resources today!"
            gradient="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800"
            actionButton="Get Started Now"
            opensContactSalesModal={true} // Added prop
          />
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Remove original header and buttons */}
      <h1 className="text-2xl font-semibold mb-6">Dedicated Servers</h1>

      {/* Keep ServerCard Banner */}
      <div className="mb-6"> {/* Add margin below the card */}
        <ServerCard
          title="Launch a Dedicated Server"
          description="Our Dedicated Forex Server handles all intense and complex trading strategies. Harness powerful Inter processing power and dedicated resources today!"
          gradient="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800"
          actionButton="Get Started Now"
          opensContactSalesModal={true} // Added prop
        />
      </div>

      <Table columns={columns} data={serverData} /> {/* Use serverData from state */}

      {/* Use Pagination component */}
      {totalPages > 1 && (
         <div className="flex justify-center mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              // Optional: Add totalItems and pageSize if needed by Pagination component
              // totalItems={totalItems}
              // pageSize={pageSize}
            />
         </div>
      )}
    </div>
  );
};

export default DedicatedProductsPage;
