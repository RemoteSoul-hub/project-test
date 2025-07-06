'use client'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Table from '@/components/table/Table';
import TableToolbar from '@/components/table/TableToolbar';
import ComponentEditModal from '@/components/admin/ComponentEditModal';
import { getAuthToken } from '@/services/AuthService';

export default function AdminComponentsPage() {
  const { data: session, status } = useSession();
  const [components, setComponents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('type');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [authToken, setAuthToken] = useState(null); // Add state for token
  const [isClient, setIsClient] = useState(false); // Track if we're on client

  // Updated componentTypes to match singular names stored in DB (removed GPU)
  const componentTypes = [
    { value: '', label: 'All Types' },
    { value: 'cpu', label: 'CPU' },
    { value: 'memory', label: 'Memory' },
    { value: 'storage', label: 'Storage' },
    { value: 'location', label: 'Locations' },
    { value: 'operatingSystems', label: 'Operating Systems' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Enabled' },
    { value: 'false', label: 'Disabled' }
  ];

  const availabilityOptions = [
    { value: '', label: 'All Availability' },
    { value: 'available', label: 'Available' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'not_in_datapacket', label: 'Not in DataPacket' }
  ];

  // Initialize client-side state and get auth token
  useEffect(() => {
    setIsClient(true);
    
    // Get token only on client side
    const token = session?.accessToken || getAuthToken();
    setAuthToken(token);
    
    console.log('🔍 AUTH DEBUG:', {
      sessionStatus: status,
      hasSession: !!session,
      sessionData: session,
      hasToken: !!token,
      tokenPreview: token ? `${String(token).substring(0, 20)}...` : 'NO TOKEN',
      authTokenFromService: !!getAuthToken(),
      accessToken: !!session?.accessToken,
      shouldFetch: !!token,
      timestamp: new Date().toISOString()
    });
  }, [session, status]);

  // Fetch components when token is available
  useEffect(() => {
    if (!isClient) return; // Don't run on server
    
    console.log('📍 Fetch useEffect triggered');
    console.log('- Status:', status);
    console.log('- Session:', session);
    console.log('- Auth Token:', !!authToken);
    
    // Fetch data if we have a token, OR if we don't need auth (since page is now public)
    if (authToken) {
      console.log('✅ Token found, fetching components...');
      fetchComponents(authToken);
    } else {
      // Since the page is now public, try fetching without auth
      console.log('🔓 No token, trying public access...');
      fetchComponents(null);
    }
  }, [authToken, isClient, currentPage, searchTerm, selectedType, selectedStatus, selectedAvailability, sortField, sortDirection]);

  const fetchComponents = async (token) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (currentPage > 1) params.append('page', currentPage);
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType) params.append('type', selectedType);
      if (selectedStatus) params.append('enabled', selectedStatus);
      if (selectedAvailability) params.append('availability', selectedAvailability);
      if (sortField) {
        params.append('sort', sortDirection === 'desc' ? `-${sortField}` : sortField);
      }

      const url = `/api/admin/components?${params.toString()}`;
      console.log('🔍 Fetching from URL:', url);
      console.log('🔑 Using token:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN (PUBLIC ACCESS)');

      const headers = {
        'Content-Type': 'application/json'
      };

      // Only add Authorization header if we have a token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Parsed data:', data);
      console.log('📊 Components received:', data.data?.length || 0);

      if (!data.data || !Array.isArray(data.data)) {
        console.error('❌ Invalid data structure:', data);
        throw new Error('Invalid data structure from API');
      }

      setComponents(data.data);
      setTotalPages(data.meta?.totalPages || 1);

    } catch (error) {
      console.error('❌ Error fetching components:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update component
  const updateComponent = async (componentId, updates) => {
    if (!authToken) {
      throw new Error('Authentication required for updates');
    }

    const response = await fetch('/api/admin/components', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: componentId,
        updates
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update component');
    }

    // Refresh the current page
    fetchComponents(authToken);
  };

  const toggleComponentStatus = async (componentId, currentStatus) => {
    if (!authToken) return;

    try {
      const response = await fetch('/api/admin/components', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: componentId,
          updates: { is_enabled: !currentStatus }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update component`);
      }

      // Refresh the current page
      fetchComponents(authToken);

    } catch (error) {
      console.error('Error updating component:', error);
      setError(error.message);
    }
  };

  // Sync components from DataPacket API
  const syncComponents = async () => {
    if (!authToken) return;

    try {
      setSyncing(true);
      setError(null);

      console.log('Starting component sync...');

      const response = await fetch('/api/admin/components', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Sync response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Sync error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Sync result:', result);
      
      setLastSync(new Date());
      
      // Refresh the current page
      fetchComponents(authToken);

      // Show success message
      alert(`Sync completed! Added: ${result.componentsAdded}, Updated: ${result.componentsUpdated}`);

    } catch (error) {
      console.error('Error syncing components:', error);
      setError(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Reset all components from database
  const resetDatabase = async () => {
    if (!authToken) return;

    try {
      setResetting(true);
      setError(null);

      console.log('Starting database reset...');

      const response = await fetch('/api/admin/components', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmReset: true
        })
      });

      console.log('Reset response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Reset error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Reset result:', result);
      
      // Clear local state
      setComponents([]);
      setTotalPages(1);
      setCurrentPage(1);
      
      // Close modal and reset form
      setIsResetModalOpen(false);
      setResetConfirmText('');

      // Show success message
      alert(`Database reset completed! Deleted ${result.deletedCount} components.`);

    } catch (error) {
      console.error('Error resetting database:', error);
      setError(`Reset failed: ${error.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Format component type for display
  const formatType = (type) => {
    const typeMap = {
      'cpu': 'CPU',
      'memory': 'Memory',
      'storage': 'Storage',
      'location': 'Location',
      'operatingSystems': 'OS'
    };
    return typeMap[type] || type;
  };

  // Format price
  const formatPrice = (price, customPrice) => {
    const displayPrice = customPrice !== null && customPrice !== undefined ? customPrice : price;
    const numericPrice = Number(displayPrice) || 0;
    return `${numericPrice.toFixed(2)}`;
  };

  // Get status badge styles - Updated to use is_available
  const getStatusStyles = (enabled, isAvailable) => {
    if (!isAvailable) {
      return 'bg-red-100 text-red-600';
    }
    return enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600';
  };

  const columns = [
    {
      header: 'Type',
      accessor: 'type',
      sortable: true,
      cell: (value) => formatType(value),
      headerCell: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('type')}>
          Type
          {sortField === 'type' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      cell: (value, row) => (
        <div>
          <div className="font-medium">{row.custom_name || value}</div>
          {row.custom_name && (
            <div className="text-xs text-gray-500">Original: {value}</div>
          )}
        </div>
      ),
      headerCell: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('name')}>
          Name
          {sortField === 'name' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Price',
      accessor: 'base_price',
      sortable: true,
      cell: (value, row) => {
        // Don't show price for locations since they don't have individual pricing
        if (row.type === 'location' || row.type === 'operatingSystems') {
          return <span className="text-gray-400">-</span>;
        }
        
        return (
          <div>
            <div className="font-medium">{formatPrice(value, row.custom_price)}</div>
            {row.custom_price !== null && (
              <div className="text-xs text-gray-500">Original: ${value.toFixed(2)}</div>
            )}
          </div>
        );
      },
      headerCell: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('base_price')}>
          Price
          {sortField === 'base_price' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Specifications',
      accessor: 'specs',
      cell: (value) => {
        if (!value) return '-';
        
        if (typeof value === 'object') {
          const specs = [];
          if (value.cores) specs.push(`${value.cores} cores`);
          if (value.threads) specs.push(`${value.threads} threads`);
          if (value.capacity) specs.push(value.capacity);
          if (value.capacityGB) specs.push(`${value.capacityGB}GB`);
          if (value.size) specs.push(`${value.size}GB`);
          if (value.type && value.type !== 'location' && value.type !== 'operatingSystems') specs.push(value.type.toUpperCase());
          if (value.speed) specs.push(value.speed);
          if (value.speedMHz) specs.push(`${value.speedMHz}MHz`);
          if (value.region) specs.push(`Region: ${value.region}`);
          if (value.osImageId) specs.push(`OS ID: ${value.osImageId}`);
          
          return specs.length > 0 ? specs.join(', ') : JSON.stringify(value).substring(0, 50) + '...';
        }
        
        return value.toString().substring(0, 50) + '...';
      }
    },
    {
      header: 'Status',
      accessor: 'is_enabled',
      cell: (value, row) => (
        <div className="flex flex-col gap-1">
          {/* Main status badge */}
          <div className={`px-2 py-1 rounded-full text-xs text-center ${getStatusStyles(value, row.is_available)}`}>
            {!row.is_available ? 'Unavailable' : value ? 'Enabled' : 'Disabled'}
          </div>
          
          {/* Stock information - only show if we have stock data */}
          {row.stock_count !== undefined && (
            <div className={`text-xs ${row.in_stock ? 'text-green-600' : 'text-red-600'}`}>
              Stock: {row.stock_count} {row.in_stock ? '✓' : '✗'}
            </div>
          )}
          
          {/* Only show "Not in DataPacket" if truly not available in DataPacket AND no stock */}
          {!row.datapacket_available && !row.in_stock && (
            <div className="text-xs text-red-500">Not in DataPacket</div>
          )}
        </div>
      )
    },
    {
      header: 'Admin Notes',
      accessor: 'admin_notes',
      cell: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value || '-'}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => toggleComponentStatus(value, row.is_enabled)}
            disabled={!row.is_available || !authToken}
            className={`text-xs px-2 py-1 rounded font-medium ${
              row.is_available && authToken
                ? row.is_enabled
                  ? 'text-red-600 border border-red-300 hover:bg-red-50'
                  : 'text-green-600 border border-green-300 hover:bg-green-50'
                : 'text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
            title={!authToken ? 'Login required for actions' : !row.is_available ? 'Component unavailable - out of stock or not in DataPacket' : ''}
          >
            {row.is_enabled ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={() => {
              setSelectedComponent(row);
              setIsEditModalOpen(true);
            }}
            disabled={!authToken}
            className={`text-xs px-2 py-1 rounded font-medium ${
              authToken 
                ? 'text-blue-600 border border-blue-300 hover:bg-blue-50'
                : 'text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
            title={!authToken ? 'Login required for actions' : ''}
          >
            Edit
          </button>
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
          onClick={() => setCurrentPage(currentPage - 1)}
          className={`px-2 py-1 text-gray-500 ${loading ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'}`}
        >
          Previous
        </button>
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => {
              if (typeof page === 'number' && page !== currentPage) {
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
          onClick={() => setCurrentPage(currentPage + 1)}
          className={`px-2 py-1 text-gray-500 ${loading ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'}`}
        >
          Next
        </button>
      </div>
    );
  };

  // Show loading during initial hydration
  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Get current auth state for display
  const getAuthState = () => {
    return {
      status,
      hasSession: !!session,
      hasToken: !!authToken,
      tokenPreview: authToken ? `${String(authToken).substring(0, 20)}...` : 'NO TOKEN',
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Simple Debug Info */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        Auth Status: {status} | Token: {getAuthState().hasToken ? '✓' : '✗'} | 
        Components: {components.length} | Mode: {authToken ? 'Authenticated' : 'Public View'}
      </div>

      {/* Show notice if in public mode */}
      {!authToken && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-md">
          <div className="text-sm text-blue-800">
            📋 <strong>Public View Mode</strong> - You can view components but need to log in to make changes.
          </div>
        </div>
      )}

      {/* Header with sync and reset buttons */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Component Management</h1>
          <p className="text-gray-600">Configure which DataPacket components are available to users</p>
          {lastSync && (
            <p className="text-sm text-gray-500">Last synced: {lastSync.toLocaleString()}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsResetModalOpen(true)}
            disabled={syncing || resetting || !authToken}
            className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 ${(syncing || resetting || !authToken) ? 'cursor-not-allowed' : ''}`}
            title={!authToken ? "Login required" : "Delete all components from database"}
          >
            {resetting ? 'Resetting...' : 'Reset Database'}
          </button>
          <button
            onClick={syncComponents}
            disabled={syncing || resetting || !authToken}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 ${(syncing || resetting || !authToken) ? 'cursor-not-allowed' : ''}`}
            title={!authToken ? "Login required" : "Sync components from DataPacket API"}
          >
            {syncing ? 'Syncing...' : 'Sync from DataPacket'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search components..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {componentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              value={selectedAvailability}
              onChange={(e) => {
                setSelectedAvailability(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availabilityOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('');
                setSelectedStatus('');
                setSelectedAvailability('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Reset Database</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-4">
                This will permanently delete <strong>ALL {components.length} components</strong> from the database. 
                You will need to sync from DataPacket again to restore the data.
              </p>
              <p className="text-sm text-red-600 font-medium mb-4">
                ⚠️ This action is irreversible!
              </p>
              <p className="text-sm text-gray-700 mb-2">
                Type <strong>DELETE ALL COMPONENTS</strong> to confirm:
              </p>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="DELETE ALL COMPONENTS"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={resetting}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetConfirmText('');
                }}
                disabled={resetting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={resetDatabase}
                disabled={resetConfirmText !== 'DELETE ALL COMPONENTS' || resetting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetting ? 'Deleting...' : 'Delete All Components'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
          Error: {error}
        </div>
      )}

      {/* Statistics Cards - Updated with availability metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{components.length}</div>
          <div className="text-sm text-gray-600">Total Components</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {components.filter(c => c.is_enabled && c.is_available).length}
          </div>
          <div className="text-sm text-gray-600">Active & Available</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {components.filter(c => !c.is_enabled && c.is_available).length}
          </div>
          <div className="text-sm text-gray-600">Disabled (Available)</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">
            {components.filter(c => !c.in_stock).length}
          </div>
          <div className="text-sm text-gray-600">Out of Stock</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-600">
            {components.filter(c => !c.datapacket_available).length}
          </div>
          <div className="text-sm text-gray-600">Not in DataPacket</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={components}
          loading={loading}
        />
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && components.length > 0 && renderPagination()}

      {/* Edit Modal */}
      <ComponentEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedComponent(null);
        }}
        component={selectedComponent}
        onSave={updateComponent}
      />
    </div>
  );
}