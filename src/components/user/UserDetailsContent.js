'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@/components/table/Table';
import Image from 'next/image';
import Link from 'next/link';
// Import necessary icons and components from products page
import { MoreVertical, RefreshCw, Power, KeyRound, Play, Pause, Monitor, Mail, Terminal, BarChart2, FileText, Trash2, ChevronDown } from 'lucide-react'; 
import { createPortal } from 'react-dom';
import ApiService from '@/services/apiService';
import ServerService from '@/services/serverService'; // Import ServerService
import DeleteUserModal from '@/components/user/DeleteUserModal'; // Keep user delete modal
import DeleteServerModal from '@/components/server/DeleteServerModal'; // Import server delete modal
import NotificationModal from '@/components/notification/NotificationModal'; // Import notification modal
import Pagination from '@/components/table/Pagination'; 

export default function UserDetailsContent({ 
  user, 
  infrastructureData, 
  userId,
  paginationLinks, // New prop
  paginationMeta,  // New prop
  onPageChange,    // New prop
  loadingServers,  // New prop
  serverError      // New prop
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profileDetails');
  const [actionDropdownOpen, setActionDropdownOpen] = useState(null); // Tracks which server dropdown is open (use server ID)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null); // Ref for the dropdown menu itself
  const buttonRefs = useRef({}); // Refs for the trigger buttons (map server ID to button element)
  const [isUserDeleteModalOpen, setIsUserDeleteModalOpen] = useState(false); // Renamed for clarity
  const [isServerDeleteModalOpen, setIsServerDeleteModalOpen] = useState(false); // State for server delete modal
  const [serverToDelete, setServerToDelete] = useState(null); // State to hold server info for deletion
  const [deleteLoading, setDeleteLoading] = useState(false); // Keep for user deletion for now
  const [notification, setNotification] = useState({ // State for notification modal
    isOpen: false,
    message: '',
    type: 'success'
  });
  const [serverStatuses, setServerStatuses] = useState({}); // State for dynamic statuses

  // Fetch individual server statuses when infrastructureData changes
  useEffect(() => {
    if (!infrastructureData || infrastructureData.length === 0) {
      setServerStatuses({}); // Clear statuses if data is empty
      return;
    }

    const fetchStatuses = async () => {
      // Initialize statuses as loading for servers not already checked
      const initialStatuses = { ...serverStatuses };
      let needsUpdate = false;
      infrastructureData.forEach(server => {
        if (!(server.id in initialStatuses)) {
          initialStatuses[server.id] = 'loading';
          needsUpdate = true;
        }
      });
      if (needsUpdate) {
         setServerStatuses(initialStatuses);
      }

      // Fetch actual statuses
      const statusPromises = infrastructureData.map(async (server) => {
        // Only fetch if status is loading or not set yet
        if (initialStatuses[server.id] === 'loading') { 
          try {
            const response = await ServerService.getStatus(server.id);
            return { id: server.id, status: response?.data?.status || 'error' };
          } catch (error) {
            console.error(`Error fetching status for server ${server.id}:`, error);
            return { id: server.id, status: 'error' };
          }
        }
        return null; // Skip fetching if status already known (or failed)
      });

      const results = await Promise.all(statusPromises);
      
      // Update state with fetched statuses
      setServerStatuses(prevStatuses => {
        const newStatuses = { ...prevStatuses };
        results.forEach(result => {
          if (result) { // Ignore null results (skipped fetches)
            newStatuses[result.id] = result.status;
          }
        });
        return newStatuses;
      });
    };

    fetchStatuses();
    // Dependency array includes infrastructureData to refetch when the list changes (e.g., pagination)
  }, [infrastructureData]); 
  
  // Handle delete user (remains the same)
  const handleDeleteUser = async (userId) => {
    if (deleteLoading) return;
    
    try {
      setDeleteLoading(true);
      
      // Close the modal first
      setIsDeleteModalOpen(false);
      
      try {
        // Redirect immediately to prevent errors from trying to load deleted user data
        // This needs to happen before the API call to avoid errors
        router.push('/users');
      } catch (redirectError) {
        // Ignore any redirection errors
        
      }
      
      // Then make the API call in the background
      // This ensures we don't try to load data for a deleted user
      try {
        await ApiService.delete(`/users/${userId}`);
        // API returns 204 No Content on successful deletion
        
      } catch (apiError) {
        // Ignore API errors as we've already redirected
        
      }
      
    } catch (error) {
      // Ignore all errors in the delete process
      
    }
  };
  
  // Form state
  const [formData, setFormData] = useState({
    username: user.username || '',
    fullName: user.fullName || '',
    phoneNumber: user.phoneNumber || '',
    email: user.email || '',
    role: (user.roles && user.roles.length > 0) ? user.roles[0] : 'user'
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Update form data when user prop changes
  useEffect(() => {
    
    setFormData({
      username: user.username || '',
      fullName: user.fullName || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      role: (user.roles && user.roles.length > 0) ? user.roles[0] : 'user'
    });
    console.log('Form data updated:', {
      username: user.username || '',
      fullName: user.fullName || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      role: (user.roles && user.roles.length > 0) ? user.roles[0] : 'user'
    });
  }, [user]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear success/error messages when user types
    if (formSuccess) setFormSuccess(false);
    if (formError) setFormError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setFormLoading(true);
      setFormError(null);
      setFormSuccess(false);
      
      // Map form data to API expected format
      const userData = {
        username: formData.username || null,
        name: formData.fullName,
        phone_number: formData.phoneNumber || null,
        email: formData.email,
        roles: [formData.role]
      };
      
      
      
      // Call API to update user
      const response = await ApiService.put(`/users/${userId}`, userData);
      
      
      // Show success message
      setFormSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setFormSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating user:', error);
      setFormError(error.message || 'An error occurred while updating the user');
    } finally {
      setFormLoading(false);
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionDropdownOpen !== null &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRefs.current[actionDropdownOpen]?.contains(event.target)
      ) {
        setActionDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionDropdownOpen]);

  // Handle opening the dropdown and positioning it
  const handleOpenDropdown = (e, rowIndex) => {
    e.stopPropagation();
    
    if (actionDropdownOpen === rowIndex) {
      setActionDropdownOpen(null);
      return;
    }
    
    const buttonRect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.top,
      left: buttonRect.left
    });
    setActionDropdownOpen(rowIndex);
  };

  // Helper function to format date (reuse from parent or define locally if needed)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Basic check for invalid date
      if (isNaN(date.getTime())) return 'Invalid Date'; 
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  // Handle executing server actions from dropdown
  const handleActionClick = async (action, server) => {
    // Close dropdown immediately
    setActionDropdownOpen(null); 
    
    try {
      
      const result = await action.onClick(server); // Execute the action

      // Show success notification
      if (result?.message) {
        setNotification({ isOpen: true, message: result.message, type: 'success' });
      } else if (action.label === 'Reset Password') {
        // Specific handling for reset password if no message is returned
        setNotification({ isOpen: true, message: 'Password reset initiated successfully.', type: 'success' });
      }
      
      // Potentially refresh data after action - TODO: Decide if needed or rely on parent refresh
      // For now, we assume parent component handles refresh if necessary via onPageChange or similar

    } catch (error) {
      console.error(`Error executing ${action.label}:`, error);
      // Show error notification
      setNotification({
        isOpen: true,
        message: `Failed to ${action.label.toLowerCase()}: ${error.message || 'An unknown error occurred'}`,
        type: 'error'
      });
    }
  };

  // Define actions for the dropdown (copied from products page, ServerService calls)
  // Note: Refreshing data after actions might need adjustment depending on how state is managed
  const serverActions = [
    {
      label: 'Change Plan',
      icon: <RefreshCw size={16} className="mr-2" />,
      onClick: async (server) => {
        
        // TODO: Implement Change Plan Modal or logic
        return { message: 'Change Plan action clicked (not implemented yet).' }; 
      }
    },
    {
      label: 'Reboot',
      icon: <Power size={16} className="mr-2" />,
      onClick: async (server) => {
        await ServerService.reboot(server.id);
        // TODO: Refresh data?
        return { message: 'Reboot initiated successfully.' };
      }
    },
    {
      label: 'Rebuild',
      icon: <RefreshCw size={16} className="mr-2" />,
      onClick: async (server) => {
        await ServerService.rebuild(server.id);
         // TODO: Refresh data?
        return { message: 'Rebuild initiated successfully.' };
      }
    },
    {
      label: 'Reset Password',
      icon: <KeyRound size={16} className="mr-2" />,
      onClick: async (server) => {
        await ServerService.resetPassword(server.id);
        // No explicit success message needed here, handled in handleActionClick
      }
    },
    {
      label: 'Start',
      icon: <Play size={16} className="mr-2" />,
      onClick: async (server) => {
        await ServerService.start(server.id);
         // TODO: Refresh data?
        return { message: 'Start initiated successfully.' };
      }
    },
    {
      label: 'Stop',
      icon: <Power size={16} className="mr-2" />,
      onClick: async (server) => {
        await ServerService.stop(server.id);
         // TODO: Refresh data?
        return { message: 'Stop initiated successfully.' };
      }
    },
    {
      label: 'Suspend',
      icon: <Pause size={16} className="mr-2" />,
      onClick: async (server) => {
        await ServerService.suspend(server.id);
         // TODO: Refresh data?
        return { message: 'Suspend initiated successfully.' };
      }
    },
    {
      label: 'Unsuspend',
      icon: <Play size={16} className="mr-2" />,
      onClick: async (server) => {
        await ServerService.unsuspend(server.id);
         // TODO: Refresh data?
        return { message: 'Unsuspend initiated successfully.' };
      }
    },
    {
      label: 'VNC Console',
      icon: <Monitor size={16} className="mr-2" />,
      onClick: async (server) => {
        const response = await ServerService.getVnc(server.id);
        if (response?.data?.socket_hash && response?.data?.socket_password) {
          const vncUrl = `/vnc-client.html?password=${encodeURIComponent(response.data.socket_password)}&path=${encodeURIComponent(response.data.socket_hash)}`;
          const windowFeatures = 'width=800,height=600,resizable=yes,scrollbars=yes,status=yes';
          window.open(vncUrl, 'vncConsole', windowFeatures);
        } else if (response?.data?.url) {
          window.open(response.data.url, '_blank');
        } else {
          throw new Error('Could not retrieve VNC connection data.');
        }
      }
    },
    {
      label: 'Delete Server',
      icon: <Trash2 size={16} className="mr-2" />,
      className: "text-red-600",
      onClick: async (server) => {
        setServerToDelete(server); // Set server data for the modal
        setIsServerDeleteModalOpen(true); // Open the server delete modal
        return null; // No immediate message
      }
    }
  ];
  
  // Helper function to format timestamp like in products page
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null; // Handle null or undefined timestamps
    const date = new Date(timestamp);
     if (isNaN(date.getTime())) return <span className="text-red-500">Invalid Date</span>; // Check for invalid date
    return (
      <div>
        <div>{date.toLocaleDateString()}</div>
        <div className="text-xs text-gray-500">{date.toLocaleTimeString()}</div>
      </div>
    );
  };

  // Define columns based on products page, adapted for user server data
  const infrastructureColumns = [
     // No 'User' column needed here
    { 
      accessor: 'created_at', // Use original timestamp
      header: 'Created',
      headerCell: () => ( // Add header cell for potential sorting
        <div className="flex items-center gap-1 cursor-pointer">
          Created <ChevronDown size={16} /> 
        </div>
      ),
      cell: (value) => formatTimestamp(value) // Use the timestamp formatter
    },
    { 
      accessor: 'hostname', 
      header: 'Label', // Match header text from products page
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Label <ChevronDown size={16} />
        </div>
      ),
      cell: (value, row) => ( // Link to server details
        <Link href={`/infrastructure/vps/products/${row.id}`} className="text-blue-600 hover:underline">
          {value || 'N/A'} 
        </Link>
      )
    },
    { 
      accessor: 'primary_ip_address', 
      header: 'IP',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          IP <ChevronDown size={16} />
        </div>
      ),
      cell: (value) => value || 'Not assigned' // Handle missing IP
    },
    { 
      accessor: 'cpu', // Need to combine cpu_count and cpu_type
      header: 'CPU',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          CPU <ChevronDown size={16} />
        </div>
      ),
      cell: (_, row) => { // Access full row data
        const count = row.cpu_count;
        const type = row.cpu_type;
        const hasCount = typeof count === 'number';
        const hasType = type && type !== 'N/A';

        if (!hasCount && !hasType) {
           return <div>Unknown CPU</div>;
        }

        return (
          <div>
            {hasCount && <div>{count} {count === 1 ? 'Core' : 'Cores'}</div>}
            {hasType && <div className="text-sm text-gray-500">{type}</div>}
          </div>
        );
      }
    },
    { 
      accessor: 'memory_size', // Use memory_size directly
      header: 'RAM',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          RAM <ChevronDown size={16} />
        </div>
      ),
       cell: (value) => typeof value === 'number' ? `${(value / 1024).toFixed(0)} GB` : 'Unknown' // Format MB to GB
    },
    { 
      accessor: 'disk_size', // Use disk_size directly
      header: 'Storage',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Storage <ChevronDown size={16} />
        </div>
      ),
      cell: (value) => typeof value === 'number' ? `${value} GB` : 'Unknown'
    },
    { 
      accessor: 'location', // Access nested location name
      header: 'Location',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Location <ChevronDown size={16} />
        </div>
      ),
      cell: (_, row) => row.location?.name || 'Unknown' // Use optional chaining
    },
    { 
      accessor: 'status', // This will be populated dynamically later if needed
      header: 'Status',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Status <ChevronDown size={16} />
        </div>
      ),
      cell: (_, row) => { // Access the full row to get the ID
        const status = serverStatuses[row.id] || 'loading'; // Get status from state, default to loading
        
        let statusColor = 'bg-gray-500'; // Default color
        let statusText = 'Unknown';
        let showSpinner = false;

        switch (status) {
          case 'loading':
            statusColor = 'bg-gray-400';
            statusText = 'Loading';
            showSpinner = true;
            break;
          case 'running':
            statusColor = 'bg-green-500';
            statusText = 'Running';
            break;
          case 'stopped':
            statusColor = 'bg-red-500';
            statusText = 'Stopped';
            break;
          case 'suspended':
            statusColor = 'bg-yellow-500';
            statusText = 'Suspended';
            break;
          case 'provisioning':
            statusColor = 'bg-blue-500';
            statusText = 'Provisioning';
            showSpinner = true; 
            break;
          case 'error':
            statusColor = 'bg-red-500';
            statusText = 'Error';
            break;
          default:
            statusText = status; // Display unknown status text if needed
        }

        return (
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${statusColor} ${showSpinner ? 'animate-pulse' : ''}`}></div>
            <span className="text-sm">{statusText}</span>
            {showSpinner && status !== 'loading' && ( // Show spinner for provisioning, but not initial loading text
              <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent ml-1"></div>
            )}
          </div>
        );
      }
    }
    // Removed the 'actions' column definition (confirmed in previous step)
  ];

  // Mock software data (remains the same for now)
  const softwareData = [
    {
      name: 'Software 1',
      version: '1.0.0',
      status: 'Active',
      dateInstalled: '30/12/2025',
    },
    {
      name: 'Software 2',
      version: '2.1.0',
      status: 'Active',
      dateInstalled: '30/12/2025',
    },
  ];

  const softwareColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Version', accessor: 'version' },
    { header: 'Status', accessor: 'status' },
    { header: 'Date Installed', accessor: 'dateInstalled' },
  ];

  // Mock transactions data
  const transactionsData = [];
  const transactionsColumns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Status', accessor: 'status' },
    { header: 'Type', accessor: 'type' },
  ];

  // Helper function to render the main content for each tab
  function renderTabContent() {
    switch (activeTab) {
      case 'profileDetails':
        return (
          <div className="p-4 md:p-6"> {/* Added responsive padding */}
            {formSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md">
                User information updated successfully!
              </div>
            )}
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                {formError}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div className="mb-4">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  {user.login_username ? (
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        {user.login_username.split('.')[0]}.
                      </span>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        className="flex-1 min-w-0 p-2 border border-gray-300 rounded-none rounded-r-md"
                        value={formData.username}
                        onChange={handleInputChange}
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={formData.username}
                      onChange={handleInputChange}
                    />
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Language
                  </label>
                  <div className="relative">
                    <select
                      id="language"
                      name="language"
                      className="w-full p-2 border border-gray-300 rounded-md appearance-none pr-8"
                      defaultValue="English"
                      disabled
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Permissions
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      name="role"
                      className="w-full p-2 border border-gray-300 rounded-md appearance-none pr-8"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="user">User</option>
                      <option value="partner">Partner</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-4 space-y-2 sm:space-y-0 mt-6"> {/* Responsive button layout */}
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto"
                  onClick={() => {
                    // Reset form to original user data
                    setFormData({
                      username: user.username || '',
                      fullName: user.fullName || '',
                      phoneNumber: user.phoneNumber || '',
                      email: user.email || '',
                      role: (user.roles && user.roles.length > 0) ? user.roles[0] : 'user'
                    });
                    setFormError(null);
                    setFormSuccess(false);
                  }}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 w-full sm:w-auto"
                  onClick={() => setIsUserDeleteModalOpen(true)} // Corrected state setter
                  disabled={formLoading}
                >
                  Delete User
                </button>
              </div>
            </form>
          </div>
        );
      case 'infrastructure':
        return (
          <div className="p-4 md:p-6"> {/* Added responsive padding */}
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0"> {/* Responsive header */}
              <h2 className="text-xl font-semibold">Infrastructure</h2>
              {/* <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto">
                Add New
              </button> */}
            </div>
            
            {/* Server Loading State */}
            {loadingServers && (
              <div className="text-center py-4">Loading servers...</div>
            )}

            {/* Server Error State */}
            {serverError && !loadingServers && (
              <div className="text-center py-4 text-red-600">{serverError}</div>
            )}

            {/* Server Table */}
            {!loadingServers && !serverError && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4"> {/* Added overflow-x-auto */}
                <Table columns={infrastructureColumns} data={infrastructureData} />
              </div>
            )}

            {/* Pagination Controls */}
            {!loadingServers && paginationMeta && paginationMeta.total > paginationMeta.per_page && (
              <Pagination 
                currentPage={paginationMeta.current_page} 
                totalPages={paginationMeta.last_page} 
                onPageChange={onPageChange} 
                totalItems={paginationMeta.total} 
                pageSize={paginationMeta.per_page} 
              />
            )}
            
            {/* No Servers Message */}
             {!loadingServers && !serverError && infrastructureData.length === 0 && (
              <div className="text-center py-8 text-gray-500">No infrastructure found for this user.</div>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div>
      {/* Back button without bottom border */}
      <div className="p-4">
        <Link href="/users" className="flex items-center text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          <span className="text-lg md:text-xl font-semibold">{user.fullName}</span> {/* Responsive text size */}
        </Link>
      </div>

      {/* Tabs with only bottom border */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap px-2 md:px-0"> {/* Added flex-wrap and responsive padding */}
          <button
            onClick={() => setActiveTab('profileDetails')}
            className={`px-3 py-3 text-sm font-medium whitespace-nowrap md:px-6 ${ // Responsive padding & no wrap
              activeTab === 'profileDetails'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab('infrastructure')}
            className={`px-3 py-3 text-sm font-medium whitespace-nowrap md:px-6 ${ // Responsive padding & no wrap
              activeTab === 'infrastructure'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Infrastructure ({infrastructureData.length})
          </button>
          {/* <button
            onClick={() => setActiveTab('software')}
            className={`px-3 py-3 text-sm font-medium whitespace-nowrap md:px-6 ${ // Responsive padding & no wrap
              activeTab === 'software'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Software ({softwareData.length}) {/* Corrected count display */}
          {/* </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-3 text-sm font-medium whitespace-nowrap md:px-6 ${ // Responsive padding & no wrap
              activeTab === 'transactions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Transactions
          </button> */}
        </div>
      </div>

      {/* Render the selected tab content */}
      {renderTabContent()}
      
      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={isUserDeleteModalOpen} // Corrected state variable
        onClose={() => setIsUserDeleteModalOpen(false)} // Corrected state setter
        onConfirm={handleDeleteUser}
        user={user}
      />
      
      {/* Dropdown Portal */}
      {typeof window !== 'undefined' && actionDropdownOpen !== null && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-white rounded-md shadow-lg z-[9999] border"
          style={{
            width: '220px',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            transform: 'translate(-80%, 10px)'
          }}
        >
          <ul className="py-1">
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
              <RefreshCw size={16} className="mr-2 text-gray-600" />
              <span>Rebuild</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
              <Power size={16} className="mr-2 text-gray-600" />
              <span>Reboot</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
              <KeyRound size={16} className="mr-2 text-gray-600" />
              <span>Reset Password</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
              <Link2 size={16} className="mr-2 text-purple-600" />
              <span>Unlink From Client</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
              <Mail size={16} className="mr-2 text-blue-600" />
              <span>Resend VPS Email</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
              <Terminal size={16} className="mr-2 text-gray-600" />
              <span>Open Console</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
              <BarChart2 size={16} className="mr-2 text-indigo-600" />
              <span>Sync Information</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
              <FileText size={16} className="mr-2 text-gray-600" />
              <span>API Log</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
              <Trash2 size={16} className="mr-2 text-red-600" />
              <span>Delete VPS</span>
            </li>
          </ul>
        </div>,
        document.body
      )}

      {/* Notification Modal */}
      {notification.isOpen && (
        <NotificationModal
          isOpen={notification.isOpen}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, isOpen: false })}
        />
      )}
      
      {/* Delete Server Modal */}
      {isServerDeleteModalOpen && serverToDelete && (
        <DeleteServerModal
          isOpen={isServerDeleteModalOpen}
          onClose={() => setIsServerDeleteModalOpen(false)}
          serverId={serverToDelete.id}
          serverName={serverToDelete.hostname} // Use hostname for name
          onDeleted={() => {
            setIsServerDeleteModalOpen(false);
            setNotification({
              isOpen: true,
              message: 'Server delete initiated successfully.', // Or confirm actual deletion
              type: 'success'
            });
            // Refresh the server list by calling the parent's page change handler
            // This assumes onPageChange can trigger a refresh even on the current page
            if (onPageChange && paginationMeta) {
              onPageChange(paginationMeta.current_page); 
            }
          }}
        />
      )}
    </div>
  );
}
