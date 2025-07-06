'use client';

import React, { useState, useEffect, useRef } from 'react';
import Table from '@/components/table/Table';
import { ChevronDown, FileText, Monitor, Mail, RefreshCw, Power, KeyRound, Play, Pause, BarChart2, Plus, MoreVertical, Trash2, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';
import TableToolbar from '@/components/table/TableToolbar';
import LineChart from '@/components/LineChart'; // Import LineChart
import FilterPanel from '@/components/table/FilterPanel';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ApiService from '@/services/apiService';
import ServerService from '@/services/serverService';
import Pagination from '@/components/table/Pagination';
import NotificationModal from '@/components/notification/NotificationModal';
import CreateServerModal from '@/components/partner/CreateServerModal';
import DeleteServerModal from '@/components/server/DeleteServerModal';
import { createPortal } from 'react-dom';

const VPSProductsPage = () => {
  const router = useRouter();

  // State for metric cards
  const [serversCreatedToday, setServersCreatedToday] = useState(0);
  const [serversTerminatedToday, setServersTerminatedToday] = useState(0);
  const [currentServerCount, setCurrentServerCount] = useState(0);
  const [serversCreatedHistory, setServersCreatedHistory] = useState([]);
  const [serversTerminatedHistory, setServersTerminatedHistory] = useState([]);
  const [serverCountHistory, setServerCountHistory] = useState([]);
  const [serversCreatedPctChange, setServersCreatedPctChange] = useState({ value: 0, trend: 'neutral' });
  const [serversTerminatedPctChange, setServersTerminatedPctChange] = useState({ value: 0, trend: 'neutral' });
  const [serverCountPctChange, setServerCountPctChange] = useState({ value: 0, trend: 'neutral' });
  // const [totalServers, setTotalServers] = useState(0); // Replaced by currentServerCount from /stats
  const [showCreateModal, setShowCreateModal] = useState(false);

  // State hooks
  const [serverData, setServerData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serverToDelete, setServerToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const [notification, setNotification] = useState({
    isOpen: false,
    message: '',
    type: 'success'
  });
  const dropdownRefs = useRef({});
  // Add sorting state
  const [sortField, setSortField] = useState('created_at'); // Default sort field (created_at for newest first)
  const [sortDirection, setSortDirection] = useState('desc'); // Default sort direction

  // Function to handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
    // fetchServers(); // fetchServers is called by the useEffect hook when sortField or sortDirection changes
  };

    // Function to handle server creation
    const handleServerCreated = () => {
        fetchServers(); // Refresh server list
    };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the currently open dropdown menu (portal content)
      // AND not on the button that opened it.
      // dropdownRefs.current[openDropdown] now refers to the portal div.
      // The buttonRef is local to DropdownMenu, so we can't directly check it here.
      // However, the button's onClick has stopPropagation, so it won't trigger this.
      // We only need to check if the click is outside the dropdown content itself.
      if (openDropdown !== null && dropdownRefs.current[openDropdown] && !dropdownRefs.current[openDropdown].contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchend', handleClickOutside); // Add touch event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside); // Clean up touch event listener
    };
  }, [openDropdown]);

    // MetricCard component
    const MetricCard = ({ title, value, chartData, percentageChange }) => {
      const getMinMax = (data) => {
        if (!data || data.length === 0) return { min: 0, max: 10 };
        const values = data.map(item => item.usage);
        let min = Math.min(...values);
        let max = Math.max(...values);
        if (min === max) { // Handle case where all values are the same
            min = min > 0 ? min * 0.8 : -1; // Adjust if min is 0 or positive
            max = max > 0 ? max * 1.2 : 1;  // Adjust if max is 0 or positive
            if (min === 0 && max === 0) { // if all values are 0
              max = 10;
            }
        }
        const padding = (max - min) * 0.1;
        return { 
          min: Math.max(0, min - padding), // Ensure min is not negative for counts
          max: max + padding 
        };
      };
      const { min, max } = getMinMax(chartData);

      const trendColor = percentageChange.trend === 'up' ? 'text-green-500' : percentageChange.trend === 'down' ? 'text-red-500' : 'text-gray-500';
      const TrendIcon = percentageChange.trend === 'up' ? ArrowUp : percentageChange.trend === 'down' ? ArrowDown : null;

      return (
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <MoreHorizontal size={20} className="text-gray-400 cursor-pointer" />
          </div>
          
          <div className="my-2">
            <span className="text-3xl font-bold text-gray-800">{value}</span>
          </div>
          
          <div className="flex items-end justify-between mt-auto">
            <div className="text-xs">
              {TrendIcon && <TrendIcon size={14} className={`inline mr-1 ${trendColor}`} />}
              <span className={`${trendColor} font-medium`}>
                {percentageChange.value !== null ? `${percentageChange.value.toFixed(1)}%` : 'N/A'}
              </span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
            <div className="w-1/2 h-10 ml-2"> {/* Adjusted height for chart container */}
              {chartData && chartData.length > 0 && <LineChart data={chartData} min={min} max={max} />}
            </div>
          </div>
        </div>
      );
    };

  // Set page size to 10 as required
  const pageSize = 10;

  // Fetch servers from API
  const fetchServers = async () => {
    try {
      // Only show loading state on first page load or search/filter changes, not on pagination
      const isPaginationOnly = !searchTerm && Object.keys(filters).length === 0;
      if (!isPaginationOnly || serverData.length === 0) {
        setLoading(true);
      }
      setError(null);
      
      // Check if API URL is configured
      if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        throw new Error('API base URL is not configured');
      }

      const queryParams = {
        'filter[type]': 'virtual',
        'sort': sortField, // Use sortField directly
        'direction': sortDirection, // Add direction parameter
        page: currentPage,
        per_page: pageSize
      };

      // Add search term if provided
      if (searchTerm) {
        queryParams['filter[search]'] = searchTerm;
      }

      // Add filters if provided
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams[`filter[${key}]`] = value;
        }
      });

      
      const response = await ApiService.get('/servers', queryParams);
      
      
      
      if (!response || !response.data) {
        throw new Error('Invalid API response format');
      }

      const transformedData = response.data.map(server => ({
        id: server.id,
        user: server.user?.name || server.user?.username || 'Unknown',
        label: server.hostname,
        ip: server.primary_ip_address || 'Not assigned',
        created: new Date(server.created_at).toLocaleDateString(),
        createdTimestamp: server.created_at, // Store the original timestamp
        cpu: {
          count: typeof server.cpu_count === 'number' ? server.cpu_count : 'Unknown',
          type: server.cpu_type || 'N/A'
        },
        ram: typeof server.plan?.memory_size === 'number' ? `${(server.plan.memory_size / 1024).toFixed(0)} GB` : 'Unknown',
        storage: typeof server.plan?.disk_size === 'number' ? `${server.plan.disk_size} GB` : 'Unknown',
        location: server.location?.name || 'Unknown',
        status: 'loading' // Initial loading state for status
      }));

      // Update the data without causing a layout shift
      setServerData(transformedData);
      setTotalItems(response.meta?.total || 0);
    } catch (err) {
      console.error('Error fetching servers:', err);
      let errorMessage = 'Failed to load servers';
      
      if (err.message?.includes('Network error')) {
        errorMessage = 'Unable to connect to the API server';
      } else if (err.message?.includes('API base URL')) {
        errorMessage = 'API configuration error - please contact support';
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expired - please login again';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setServerData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch status for each server
  const fetchServerStatuses = async () => {
    if (serverData.length === 0) return;
    
    
    
    // Create a copy of the current server data
    const updatedServerData = [...serverData];
    
    // Create an array of promises for fetching status
    const statusPromises = serverData.map(async (server, index) => {
      try {
        
        const response = await ServerService.getStatus(server.id);
        
        
        // Update the status in our copy
        if (response && response.data && response.data.status) {
          
          updatedServerData[index] = {
            ...updatedServerData[index],
            status: response.data.status
          };
        } else {
          console.warn(`Invalid status response for server ${server.id}:`, response);
        }
      } catch (error) {
        console.error(`Error fetching status for server ${server.id}:`, error);
        // Set status to error if fetch fails
        updatedServerData[index] = {
          ...updatedServerData[index],
          status: 'error'
        };
      }
    });
    
    try {
      // Wait for all status fetches to complete with a timeout
      await Promise.all(statusPromises);
      
      // Update the state with all statuses
      setServerData(updatedServerData);
    } catch (error) {
      console.error("Error updating server statuses:", error);
      // Still update the UI with what we have to prevent freezing
      setServerData(updatedServerData);
    }
  };

  // Fetch servers when page changes
  // Set filteredData directly from serverData without additional filtering
  // since the API already returns filtered data
  useEffect(() => {
    
    if (serverData.length > 0) {
      setFilteredData(serverData);
      
    }
  }, [serverData]);

  // Removed and replaced with separate effects for pagination and search/filters

  // Separate effect for search/filter changes and sorting (resets to page 1)
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search/filters or sorting changes
    fetchServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, JSON.stringify(filters), sortField, sortDirection]); // Track all sorting and filtering changes
  
  // Separate effect for pagination changes only
  useEffect(() => {
    // Only fetch if we're not on initial render (search/filter changes handle that)
    if (serverData.length > 0) {
      fetchServers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Fetch stats data
  const fetchStatsData = async () => {
    try {
      // Check if API URL is configured
      if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        throw new Error('API base URL is not configured for stats');
      }
      const response = await ApiService.get('/stats');
      if (response && response.data) {
        setServersCreatedToday(response.data.today_created || 0);
        setServersTerminatedToday(response.data.today_terminated || 0);
        setCurrentServerCount(response.data.today_count || 0);

        const transformHistoryData = (historyObject) => {
          if (!historyObject) return [];
          return Object.entries(historyObject).map(([date, count]) => ({
            time: date, 
            usage: count,
          })).sort((a, b) => new Date(a.time) - new Date(b.time));
        };

        const createdHistory = transformHistoryData(response.data.servers_created);
        const terminatedHistory = transformHistoryData(response.data.servers_terminated);
        const countHistory = transformHistoryData(response.data.server_count);

        setServersCreatedHistory(createdHistory);
        setServersTerminatedHistory(terminatedHistory);
        setServerCountHistory(countHistory);

        const calculatePercentageChange = (currentValue, historyData) => {
          if (!historyData || historyData.length < 30) {
            return { value: null, trend: 'neutral' }; // Not enough data
          }
          // Value from 30 days ago (index 0 if sorted and last 30 days are present)
          // Assuming historyData is the last 30 days, so index 0 is 30 days ago.
          const oldValue = historyData[0]?.usage;

          if (typeof oldValue !== 'number' || oldValue === undefined) {
            return { value: null, trend: 'neutral' };
          }
          if (oldValue === 0) {
            return { value: currentValue > 0 ? 100.0 : 0, trend: currentValue > 0 ? 'up' : 'neutral' }; // Avoid division by zero
          }
          
          const change = ((currentValue - oldValue) / oldValue) * 100;
          let trend = 'neutral';
          if (change > 0) trend = 'up';
          if (change < 0) trend = 'down';
          
          return { value: change, trend };
        };
        
        setServersCreatedPctChange(calculatePercentageChange(response.data.today_created, createdHistory));
        setServersTerminatedPctChange(calculatePercentageChange(response.data.today_terminated, terminatedHistory));
        // For server count, the "currentValue" is today_count, and history is server_count history
        setServerCountPctChange(calculatePercentageChange(response.data.today_count, countHistory));

      } else {
        throw new Error('Invalid API response format for stats');
      }
    } catch (err) {
      console.error('Error fetching stats data:', err);
      // Set to 0 or some error state if needed
      setServersCreatedToday(0);
      setServersTerminatedToday(0);
      setCurrentServerCount(0);
      setServersCreatedHistory([]);
      setServersTerminatedHistory([]);
      setServerCountHistory([]);
      setServersCreatedPctChange({ value: 0, trend: 'neutral' });
      setServersTerminatedPctChange({ value: 0, trend: 'neutral' });
      setServerCountPctChange({ value: 0, trend: 'neutral' });
      // Optionally, set an error state for stats
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchStatsData();
  }, []);
  
  // Fetch server statuses whenever serverData changes
  useEffect(() => {
    let isComponentMounted = true;
    
    if (serverData.length > 0 && isComponentMounted) {
      fetchServerStatuses();
    }
    
    return () => {
      isComponentMounted = false;
    };
  }, [serverData.length]);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Handle page change with scroll position preservation and minimal re-renders
  const handlePageChange = (page) => {
    if (page === currentPage) return; // Skip if clicking current page
    
    // Store the current scroll position before changing pages
    const scrollPosition = window.scrollY;
    
    // Find the table container and add opacity transition
    const tableContainer = document.querySelector('.transition-opacity');
    if (tableContainer) {
      tableContainer.style.opacity = '0.6'; // Slightly fade out during transition
    }
    
    // Update only the page number
    setCurrentPage(page);
    
    // After the state update and DOM changes, restore the scroll position and opacity
    setTimeout(() => {
      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto' // Use 'auto' instead of 'smooth' to prevent additional animation
      });
      
      // Restore opacity after a short delay to allow for the data to load
      setTimeout(() => {
        if (tableContainer) {
          tableContainer.style.opacity = '1';
        }
      }, 150);
    }, 0);
  };

  // Custom DropdownMenu component
  const DropdownMenu = ({ id, row, actions }) => {
    const isOpen = openDropdown === id;
    const [position, setPosition] = useState({ top: -9999, left: -9999 }); // Initialize off-screen
    const [isPositioned, setIsPositioned] = useState(false); // New state to control visibility
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null); // Ref for the dropdown content itself
    
    useEffect(() => {
      if (isOpen && buttonRef.current && dropdownRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const dropdownRect = dropdownRef.current.getBoundingClientRect(); // Get dropdown's actual dimensions
        
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        let newLeft;
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const dropdownHalfWidth = dropdownRect.width / 2;
        
        newLeft = buttonCenterX - dropdownHalfWidth;
        
        // Clamp to viewport edges
        newLeft = Math.max(10, newLeft); // Ensure it's not too far left (10px padding)
        newLeft = Math.min(newLeft, viewportWidth - dropdownRect.width - 10); // Ensure it's not too far right (10px padding)
        
        // Add scrollX back for fixed positioning relative to document
        newLeft += window.scrollX;

        let newTop;
        const preferredTopBelow = buttonRect.bottom; // Relative to viewport
        const preferredTopAbove = buttonRect.top - dropdownRect.height; // Relative to viewport

        // Check if opening below fits within the viewport
        if (preferredTopBelow + dropdownRect.height <= viewportHeight) {
          newTop = preferredTopBelow;
        } 
        // Check if opening above fits within the viewport
        else if (preferredTopAbove >= 0) { // Check if top of dropdown is above or at viewport top
          newTop = preferredTopAbove;
        } 
        // If neither fits, try to fit it within the viewport as best as possible
        else {
          // If dropdown is taller than viewport, position at top of viewport (or with small margin)
          if (dropdownRect.height > viewportHeight) {
            newTop = 10; // 10px from top of viewport
          } else {
            // Otherwise, center it vertically within the available space, clamped to viewport
            newTop = (viewportHeight - dropdownRect.height) / 2;
            newTop = Math.max(10, newTop); // Clamp to top of viewport
            newTop = Math.min(newTop, viewportHeight - dropdownRect.height - 10); // Clamp to bottom
          }
        }
        
        setPosition({ top: newTop, left: newLeft });
        // Add a small delay to ensure the dropdown is rendered and ref is available
        // before making it visible, to prevent flicker.
        setTimeout(() => {
          setIsPositioned(true); // Mark as positioned, now safe to show
        }, 50); // 50ms delay

        // Store the actual dropdown DOM node in the parent's ref map
        dropdownRefs.current[id] = dropdownRef.current;
      } else {
        setIsPositioned(false); // Hide when closed
        setPosition({ top: -9999, left: -9999 }); // Reset position when closed
        delete dropdownRefs.current[id]; // Clean up when closed
      }
    }, [isOpen, dropdownRefs]); // Added dropdownRefs to dependency array
    
    const handleActionClick = async (action, e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        
        const result = await action.onClick(row); // Execute the action
        
        // Show success notification
        if (result?.message) {
          setNotification({
            isOpen: true,
            message: result.message,
            type: 'success'
          });
        } else if (action.label === 'Reset Password') {
          // Specific handling for reset password if no message is returned by default
          setNotification({
            isOpen: true,
            message: 'Password reset initiated successfully.',
            type: 'success'
          });
        }
        
      } catch (error) {
        console.error(`Error executing ${action.label}:`, error);
        // Show error notification
        setNotification({
          isOpen: true,
          message: `Failed to ${action.label.toLowerCase()}: ${error.message || 'An unknown error occurred'}`,
          type: 'error'
        });
      } finally {
        // Always close the dropdown
        setOpenDropdown(null);
      }
    };
    
    // Determine if an action should be disabled based on server status
    const isActionDisabled = (actionLabel, status) => {
      if (!status || status === 'loading' || status === 'error') return false;
      
      // If server is running, disable Start and Unsuspend
      if (status === 'running') {
        return ['Start', 'Unsuspend'].includes(actionLabel);
      }
      
      // If server is suspended, only enable Unsuspend and Delete Server
      if (status === 'suspended') {
        return !['Unsuspend', 'Delete Server'].includes(actionLabel);
      }
      
      // If server is stopped, disable Stop, Unsuspend, and Reboot
      if (status === 'stopped') {
        return ['Stop', 'Unsuspend', 'Reboot'].includes(actionLabel);
      }
      
      // If server is provisioning, only enable Delete Server
      if (status === 'provisioning') {
        return actionLabel !== 'Delete Server';
      }
      
      return false;
    };
    
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
            ref={dropdownRef} // Attach ref to the dropdown content
            className="fixed w-48 bg-white rounded-md shadow-lg z-[9999] border"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              visibility: isPositioned ? 'visible' : 'hidden', // Control visibility
              opacity: isPositioned ? 1 : 0, // Fade in/out
              transition: 'opacity 0.1s ease-in-out' // Smooth transition
            }}
            // Prevent click inside dropdown from closing it immediately
            onMouseDown={(e) => e.stopPropagation()} 
          >
            <ul className="py-1">
              {actions.map((action, index) => {
                const isDisabled = isActionDisabled(action.label, row.status);
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

  // Define actions for the dropdown
  const actions = [
    {
      label: 'Change Plan',
      icon: <RefreshCw size={16} className="mr-2" />,
      onClick: async (row) => {
        
        await ServerService.changePlan(row.id);
        await fetchServers();
        return { message: 'Plan change initiated successfully.' };
      }
    },
    {
      label: 'Reboot',
      icon: <Power size={16} className="mr-2" />,
      onClick: async (row) => {
        
        await ServerService.reboot(row.id);
        await fetchServers();
        return { message: 'Reboot initiated successfully.' };
      }
    },
    {
      label: 'Rebuild',
      icon: <RefreshCw size={16} className="mr-2" />,
      onClick: async (row) => {
        
        await ServerService.rebuild(row.id);
        await fetchServers();
        return { message: 'Rebuild initiated successfully.' };
      }
    },
    {
      label: 'Reset Password',
      icon: <KeyRound size={16} className="mr-2" />,
      onClick: async (row) => {
        
        await ServerService.resetPassword(row.id);
        // No explicit success message needed here, handled in handleActionClick
      }
    },
    {
      label: 'Start',
      icon: <Play size={16} className="mr-2" />,
      onClick: async (row) => {
        
        await ServerService.start(row.id);
        await fetchServers();
        return { message: 'Start initiated successfully.' };
      }
    },
    {
      label: 'Stop',
      icon: <Power size={16} className="mr-2" />,
      onClick: async (row) => {
        
        await ServerService.stop(row.id);
        await fetchServers();
        return { message: 'Stop initiated successfully.' };
      }
    },
    {
      label: 'Suspend',
      icon: <Pause size={16} className="mr-2" />,
      onClick: async (row) => {
        
        await ServerService.suspend(row.id);
        await fetchServers();
        return { message: 'Suspend initiated successfully.' };
      }
    },
    {
      label: 'Unsuspend',
      icon: <Play size={16} className="mr-2" />,
      onClick: async (row) => {
        
        await ServerService.unsuspend(row.id);
        await fetchServers();
        return { message: 'Unsuspend initiated successfully.' };
      }
    },
    {
      label: 'VNC Console',
      icon: <Monitor size={16} className="mr-2" />,
      onClick: async (row) => {
        
        const response = await ServerService.getVnc(row.id);
        
        // Check if we have the VNC data in the expected format
        if (response?.data?.socket_hash && response?.data?.socket_password) {
          // Open in a popup window
          const vncUrl = `/vnc-client.html?password=${encodeURIComponent(response.data.socket_password)}&path=${encodeURIComponent(response.data.socket_hash)}`;
          const windowFeatures = 'width=800,height=600,resizable=yes,scrollbars=yes,status=yes';
          window.open(vncUrl, 'vncConsole', windowFeatures);
        } 
        // Fallback to the old URL-based approach if that's what the API returns
        else if (response?.data?.url) {
          window.open(response.data.url, '_blank');
        } 
        else {
          throw new Error('Could not retrieve VNC connection data.');
        }
        // No message needed as a new window opens
      }
    },
    {
      label: 'Delete Server',
      icon: <Trash2 size={16} className="mr-2" />,
      className: "text-red-600",
      onClick: async (row) => {
        
        setServerToDelete(row);
        setShowDeleteModal(true);
        return null; // No immediate message, will show after confirmation
      }
    }
  ];

  // Define filter fields for VPS products
  const filterFields = [
    { name: 'request_id', label: 'Request ID', type: 'text', placeholder: 'Enter Request ID' },
    { name: 'uuid', label: 'UUID', type: 'text', placeholder: 'Enter UUID' },
    { name: 'primary_ip_address', label: 'Primary IP', type: 'text', placeholder: 'Enter IP Address' },
    { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter Username' },
    {
      name: 'location', // Assuming API filter key is 'location' and accepts location names
      label: 'Location',
      type: 'select',
      options: [ // These should ideally come from an API or a shared config
        { value: 'New York', label: 'New York' },
        { value: 'London', label: 'London' },
        { value: 'Amsterdam', label: 'Amsterdam' }, // Added Amsterdam as an example
        { value: 'Singapore', label: 'Singapore' }
      ],
      placeholder: 'Select Location'
    },
    {
      name: 'cpu_count',
      label: 'CPU Cores',
      type: 'select',
      options: [
        { value: '1', label: '1 Core' },
        { value: '2', label: '2 Cores' },
        { value: '4', label: '4 Cores' },
        { value: '8', label: '8 Cores' },
        { value: '16', label: '16 Cores' }
      ],
      placeholder: 'Select CPU Cores'
    },
    {
      name: 'memory_size', // Assuming API expects memory size in GB as a number
      label: 'RAM (GB)',
      type: 'select',
      options: [
        { value: '1', label: '1 GB' },
        { value: '2', label: '2 GB' },
        { value: '4', label: '4 GB' },
        { value: '8', label: '8 GB' },
        { value: '16', label: '16 GB' },
        { value: '32', label: '32 GB' }
      ],
      placeholder: 'Select RAM'
    },
    {
      name: 'disk_size', // Assuming API expects disk size in GB as a number
      label: 'Storage (GB)',
      type: 'select',
      options: [
        { value: '20', label: '20 GB' },
        { value: '40', label: '40 GB' },
        { value: '80', label: '80 GB' },
        { value: '160', label: '160 GB' },
        { value: '320', label: '320 GB' }
      ],
      placeholder: 'Select Storage'
    }
    // Removed Status filter as per request
  ];

  // Fetch search results
  const fetchSearchResults = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    
    try {
      // Use the same API endpoint but with a smaller page size for preview
      const queryParams = {
        'filter[type]': 'virtual',
        'filter[search]': term,
        'sort': '-created_at',
        page: 1,
        per_page: 5 // Limit to 5 results for the preview
      };
      
      const response = await ApiService.get('/servers', queryParams);
      
      if (response && response.data) {
        // Transform the data for search results
        const results = response.data.map(server => ({
          id: server.id,
          title: server.hostname,
          subtitle: server.user?.name || server.user?.username || 'Unknown',
          details: `${server.location?.name || 'Unknown'} - ${typeof server.plan?.memory_size === 'number' ? `${(server.plan.memory_size / 1024).toFixed(0)} GB` : 'Unknown'} RAM`,
          rawData: server // Keep the raw data for reference
        }));
        
        setSearchResults(results);
        
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchSearchResults(term);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle search result click
  const handleSearchResultClick = (result) => {
    // Navigate to the server details page
    router.push(`/infrastructure/vps/products/${result.id}`);
  };
  
  // Handle show all search results
  const handleShowAllResults = () => {
    // The search term is already set, so just make sure we're on page 1
    setCurrentPage(1);
    fetchServers(); // Fetch servers with current search term
  };
  
  // Render search result
  const renderSearchResult = (result) => (
    <div onClick={() => handleSearchResultClick(result)} className="cursor-pointer">
      <div className="font-medium">{result.title}</div>
      <div className="text-sm text-gray-500">{result.subtitle}</div>
      <div className="text-xs text-gray-400">{result.details}</div>
    </div>
  );

  // Handle filter apply
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle showing all results (clear search and filters) is already defined above
// Define table columns


  const columns = [
    { 
      accessor: 'user', 
      header: 'User',
      sortable: true,
      headerCell: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort('user')}
        >
          User
          {sortField === 'user' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    { 
      accessor: 'created', 
      header: 'Created',
      sortable: true,
      headerCell: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort('created_at')}
        >
          Created
          {sortField === 'created_at' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      ),
      cell: (value, row) => {
        // Format the date as a timestamp
        const date = new Date(row.createdTimestamp);
        return (
          <div>
            <div>{date.toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">{date.toLocaleTimeString()}</div>
          </div>
        );
      }
    },
    { 
      accessor: 'label', 
      header: 'Label',
      sortable: true,
      headerCell: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort('hostname')}
        >
          Label
          {sortField === 'hostname' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      ),
      cell: (value, row) => (
        <Link href={`/infrastructure/vps/products/${row.id}`} className="text-blue-600 hover:underline">
          {value}
        </Link>
      )
    },
    { 
      accessor: 'ip', 
      header: 'IP',
      sortable: true,
      headerCell: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort('primary_ip_address')}
        >
          IP
          {sortField === 'primary_ip_address' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    { 
      accessor: 'cpu', 
      header: 'CPU',
      sortable: true,
      headerCell: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort('cpu_count')}
        >
          CPU
          {sortField === 'cpu_count' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      ),
      cell: (value) => {
        const hasCount = typeof value.count === 'number';
        const hasType = value.type && value.type !== 'N/A';

        if (value.count === 0 && !hasType) {
          return <div>Unknown CPU</div>;
        }
        if (!hasCount && !hasType) {
           return <div>Unknown CPU</div>;
        }

        return (
          <div>
            {hasCount && <div>{value.count} {value.count === 1 ? 'Core' : 'Cores'}</div>}
            {hasType && <div className="text-sm text-gray-500">{value.type}</div>}
          </div>
        );
      }
    },
    { 
      accessor: 'ram', 
      header: 'RAM',
      sortable: true,
      headerCell: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort('memory_size')}
        >
          RAM
          {sortField === 'memory_size' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    { 
      accessor: 'storage', 
      header: 'Storage',
      sortable: true,
      headerCell: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort('disk_size')}
        >
          Storage
          {sortField === 'disk_size' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    { 
      accessor: 'location', 
      header: 'Location',
      sortable: true,
      headerCell: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort('location')}
        >
          Location
          {sortField === 'location' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      )
    },
    { 
      accessor: 'status', 
      header: 'Status',
      sortable: true,
      headerCell: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort('status')}
        >
          Status
          {sortField === 'status' && (
            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      ),
      cell: (value) => {
        let statusColor = 'bg-gray-500'; // Default color
        let statusText = 'Unknown';
        let isLoading = false;
        let showSpinner = false;

        if (value === 'loading') {
          statusColor = 'bg-gray-400';
          statusText = 'Loading';
          isLoading = true;
          showSpinner = true;
        } else if (value === 'running') {
          statusColor = 'bg-green-500';
          statusText = 'Running';
        } else if (value === 'stopped') {
          statusColor = 'bg-red-500';
          statusText = 'Stopped';
        } else if (value === 'suspended') {
          statusColor = 'bg-yellow-500';
          statusText = 'Suspended';
        } else if (value === 'provisioning') {
          statusColor = 'bg-blue-500';
          statusText = 'Provisioning';
          showSpinner = true; // Show spinner for provisioning status
        } else if (value === 'error') {
          statusColor = 'bg-red-500';
          statusText = 'Error';
        } else {
          statusText = value || 'Unknown';
        }

        return (
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${statusColor} ${isLoading ? 'animate-pulse' : ''}`}></div>
            <span className="text-sm">{statusText}</span>
            {showSpinner && (
              <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent ml-1"></div>
            )}
          </div>
        );
      }
    },
    {
      accessor: 'actions',
      cell: (value, row) => (
        <DropdownMenu id={row.id} row={row} actions={actions} />
      )
    }
  ];

  return (
    <div>
      <div className="p-6">
        <h1 className="text-xl sm:text-2xl font-semibold mb-4">Virtual Private Servers</h1>
        
        {/* Widget Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"> {/* Increased gap */}
          <MetricCard 
            title="VPS Creations" 
            value={serversCreatedToday} 
            chartData={serversCreatedHistory} 
            percentageChange={serversCreatedPctChange} 
          />
          <MetricCard 
            title="VPS Terminations" 
            value={serversTerminatedToday} 
            chartData={serversTerminatedHistory} 
            percentageChange={serversTerminatedPctChange} 
          />
          <MetricCard 
            title="Total VPS" 
            value={currentServerCount} 
            chartData={serverCountHistory} 
            percentageChange={serverCountPctChange} 
          />
        </div>
        
        {/* Table Toolbar moved below widget cards */}
        <div className="mb-4">
          <TableToolbar 
            search={{
              searchTerm,
              onSearch: handleSearch,
              results: searchResults,
              loading: searchLoading,
              onShowAllResults: handleShowAllResults,
              totalCount: searchResults.length,
              renderResult: renderSearchResult
            }}
            filter={{
              isActive: Object.keys(filters).length > 0,
              onClick: () => setIsFilterOpen(!isFilterOpen),
              buttonRef: filterButtonRef,
              filterFields
            }}
            addNew={{
              onClick: () => setShowCreateModal(true),
              label: "Create New Server"
            }}
          />
        </div>
      </div>
      <CreateServerModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onServerCreated={handleServerCreated} />
      <div className="px-6">
        <div className="transition-opacity duration-150 ease-in-out min-h-[500px]">
          <Table
            columns={columns}
            data={serverData}
            filteredData={filteredData}
            loading={loading}
            error={error}
          />
        </div>
      </div>
      {isFilterOpen && (
        <FilterPanel
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onApplyFilters={handleApplyFilters}
          buttonRef={filterButtonRef}
          filterFields={filterFields}
        />
      )}
      {totalItems > 10 && (
        <div className="mt-4 flex justify-center">
          <div className="transition-opacity duration-150 ease-in-out">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / 10)}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </div>
        </div>
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
      {showDeleteModal && serverToDelete && (
        <DeleteServerModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          serverId={serverToDelete.id}
          serverName={serverToDelete.label}
          onDeleted={() => {
            setShowDeleteModal(false);
            fetchServers();
            setNotification({
              isOpen: true,
              message: 'Server deleted successfully.',
              type: 'success'
            });
          }}
        />
      )}
    </div>
  );
};

export default VPSProductsPage;
