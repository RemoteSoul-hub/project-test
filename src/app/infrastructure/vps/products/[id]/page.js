'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ApiService from '@/services/apiService';
import ServerService from '@/services/serverService';
import { ChevronLeft, ChevronDown, MoreVertical, Eye, Trash2, Mail } from 'lucide-react';
import Link from 'next/link';
import StorageChart from '@/components/StorageChart';
import LineChart from '@/components/LineChart';
import { createPortal } from 'react-dom';
import Table from '@/components/table/Table';
import Pagination from '@/components/table/Pagination';
import ServerActions from '@/components/server/ServerActions';
import NotificationModal from '@/components/notification/NotificationModal';
import EmailViewerModal from '@/components/email/EmailViewerModal';

const VPSServerPage = () => {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('server-details');
  const [activeMenu, setActiveMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('unknown');
  const [isSuspended, setIsSuspended] = useState(false);
  const [cpuStats, setCpuStats] = useState([]);
  const [cpuAverage, setCpuAverage] = useState(0);
  const [networkStats, setNetworkStats] = useState([]);
  const [networkAverage, setNetworkAverage] = useState({ read: 0, write: 0 });
  const [diskStats, setDiskStats] = useState([]);
  const [diskAverage, setDiskAverage] = useState({ read: 0, write: 0 });
  const [notification, setNotification] = useState({
    isOpen: false,
    message: '',
    type: 'success'
  });
  // New state variables for emails
  const [emails, setEmails] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsTotal, setEmailsTotal] = useState(0);
  const [emailsCurrentPage, setEmailsCurrentPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const pageSize = 10;

  // Fetch server data
  useEffect(() => {
    const fetchServerData = async () => {
      try {
        setLoading(true);
        const response = await ApiService.get(`/servers/${params.id}`);
        setServerData(response.data);
      } catch (error) {
        console.error('Error fetching server data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchServerData();
    }
  }, [params.id]);

  // Fetch server status
  useEffect(() => {
    let isComponentMounted = true;
    
    const fetchServerStatus = async () => {
      if (!params.id || !isComponentMounted) return;
      
      try {
        const response = await ServerService.getStatus(params.id);
        if (response.data && isComponentMounted) {
          if (response.data.status) {
            setServerStatus(response.data.status);
          }
          // Check if the server is suspended
          if (response.data.is_suspended !== undefined) {
            setIsSuspended(response.data.is_suspended);
          }
        }
      } catch (error) {
        console.error('Error fetching server status:', error);
        if (isComponentMounted) {
          setServerStatus('unknown');
        }
      }
    };

    fetchServerStatus();
    
    // Set up interval to refresh status every 10 seconds
    const intervalId = setInterval(fetchServerStatus, 10000);
    
    return () => {
      isComponentMounted = false;
      clearInterval(intervalId);
    };
  }, [params.id]);

  // Fetch CPU stats with 5s interval
  useEffect(() => {
    let intervalId;
    const fetchCpuStats = async () => {
      if (!serverData) return;

      // Only attempt to fetch stats if the server is running
      if (serverStatus !== 'running') {
        setCpuStats(prevStats => prevStats.length > 0 ? prevStats : Array(24).fill({ time: new Date().toISOString(), usage: 0 }));
        setCpuAverage(0);
        return; // Don't make the API call for non-running states
      }

      // Proceed with API call only if status is 'running'
      try {
        const response = await ServerService.getStats(params.id, 'cpu');
        if (response.data && response.data.items) {
          const items = response.data.items.slice(-24);
          const validItems = items.filter(item => item && typeof item.usage === 'number');
          setCpuStats(validItems);
          if (validItems.length > 0) {
            const sum = validItems.reduce((acc, item) => acc + item.usage, 0);
            const avg = sum / validItems.length;
            setCpuAverage(parseFloat(avg.toFixed(2)) || 0);
            
          }
        }
      } catch (error) {
        console.error('Error fetching CPU stats:', error);
      }
    };

    if (serverData && params.id) {
      fetchCpuStats();
      intervalId = setInterval(fetchCpuStats, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [serverData, params.id, serverStatus]);

  // Fetch Network stats with 5s interval
  useEffect(() => {
    let intervalId;
    const fetchNetworkStats = async () => {
      if (!serverData) return;

      // Only attempt to fetch stats if the server is running
      if (serverStatus !== 'running') {
        setNetworkStats(prevStats => prevStats.length > 0 ? prevStats : Array(24).fill({ time: new Date().toISOString(), read: 0, write: 0 }));
        setNetworkAverage({
          read: 0,
          write: 0,
          total: 0
        });
        return; // Don't make the API call for non-running states
      }

      // Proceed with API call only if status is 'running'
      try {
        const response = await ServerService.getStats(params.id, 'network');
        if (response.data && response.data.items) {
          const items = response.data.items.slice(-24);
          const validItems = items.filter(item => 
            item && typeof item.read === 'number' && typeof item.write === 'number'
          );
          setNetworkStats(validItems);
          if (validItems.length > 0) {
            const readSum = validItems.reduce((acc, item) => acc + item.read, 0);
            const writeSum = validItems.reduce((acc, item) => acc + item.write, 0);
            const readAvg = readSum / validItems.length;
            const writeAvg = writeSum / validItems.length;
            setNetworkAverage({
              read: parseFloat(readAvg.toFixed(2)) || 0,
              write: parseFloat(writeAvg.toFixed(2)) || 0,
              total: parseFloat((readAvg + writeAvg).toFixed(2)) || 0
            });
            
          }
        }
      } catch (error) {
        console.error('Error fetching Network stats:', error);
      }
    };

    if (serverData && params.id) {
      fetchNetworkStats();
      intervalId = setInterval(fetchNetworkStats, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [serverData, params.id, serverStatus]);

  // Fetch Disk Activity stats with 5s interval
  useEffect(() => {
    let intervalId;
    const fetchDiskStats = async () => {
      if (!serverData) return;

      // Only attempt to fetch stats if the server is running
      if (serverStatus !== 'running') {
        setDiskStats(prevStats => prevStats.length > 0 ? prevStats : Array(24).fill({ time: new Date().toISOString(), read: 0, write: 0 }));
        setDiskAverage({
          read: 0,
          write: 0,
          total: 0
        });
        return; // Don't make the API call for non-running states
      }

      // Proceed with API call only if status is 'running'
      try {
        const response = await ServerService.getStats(params.id, 'disk_activity');
        if (response.data && response.data.items) {
          const items = response.data.items.slice(-24);
          const validItems = items.filter(item => 
            item && typeof item.read === 'number' && typeof item.write === 'number'
          );
          setDiskStats(validItems);
          if (validItems.length > 0) {
            const readSum = validItems.reduce((acc, item) => acc + item.read, 0);
            const writeSum = validItems.reduce((acc, item) => acc + item.write, 0);
            const readAvg = readSum / validItems.length;
            const writeAvg = writeSum / validItems.length;
            setDiskAverage({
              read: parseFloat(readAvg.toFixed(2)) || 0,
              write: parseFloat(writeAvg.toFixed(2)) || 0,
              total: parseFloat((readAvg + writeAvg).toFixed(2)) || 0
            });
            
          }
        }
      } catch (error) {
        console.error('Error fetching Disk Activity stats:', error);
      }
    };

    if (serverData && params.id) {
      fetchDiskStats();
      intervalId = setInterval(fetchDiskStats, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [serverData, params.id, serverStatus]);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeMenu !== null) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeMenu]);

  // Fetch emails when emails tab is active
  useEffect(() => {
    if (activeTab === 'emails' && params.id) {
      fetchEmails();
    }
  }, [activeTab, params.id, emailsCurrentPage]);

  // Function to fetch emails with pagination
  const fetchEmails = async () => {
    try {
      setEmailsLoading(true);
      
      const response = await ApiService.getServerEmails(params.id, {
        page: emailsCurrentPage,
        per_page: pageSize
      });
      
      // Log the entire response for debugging
      
      
      // Direct access to the response data without assumptions about structure
      if (response && typeof response === 'object') {
        let emailsData = [];
        let totalEmails = 0;
        
        // Try multiple possible paths where emails could be located
        if (Array.isArray(response.data)) {
          
          emailsData = response.data;
          totalEmails = response.meta?.total || response.data.length;
        } 
        else if (response.data && Array.isArray(response.data.data)) {
          
          emailsData = response.data.data;
          totalEmails = response.data.meta?.total || response.data.data.length;
        } 
        else if (response.success && Array.isArray(response.data)) {
          
          emailsData = response.data;
          totalEmails = response.meta?.total || response.data.length;
        }
        
        
        
        
        // Update state regardless of where we found the data
        setEmails(emailsData);
        setEmailsTotal(totalEmails);
      } else {
        console.warn('Invalid response format:', response);
        setEmails([]);
        setEmailsTotal(0);
      }
    } catch (error) {
      console.error('Error fetching server emails:', error);
      setEmails([]);
      setEmailsTotal(0);
    } finally {
      setEmailsLoading(false);
    }
  };

  // Handle email pagination
  const handleEmailPageChange = (page) => {
    setEmailsCurrentPage(page);
  };

  // Handle email view
  const handleViewEmail = (email) => {
    setSelectedEmail(email);
    setShowEmailModal(true);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Table columns configuration
  const columns = [
    { 
      accessor: 'date', 
      header: 'Transaction Date',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Transaction Date <ChevronDown size={16} />
        </div>
      )
    },
    { 
      accessor: 'product_id', 
      header: 'Product ID',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Product ID <ChevronDown size={16} />
        </div>
      )
    },
    { 
      accessor: 'product_type', 
      header: 'Product Type',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Product Type <ChevronDown size={16} />
        </div>
      )
    },
    { 
      accessor: 'value', 
      header: 'Value',
      headerCell: () => (
        <div className="flex items-center gap-1 cursor-pointer">
          Value <ChevronDown size={16} />
        </div>
      )
    }
  ];

  // Dropdown actions for the table
  const dropdownActions = [
    {
      label: 'View Details',
      icon: <Eye size={16} />,
      onClick: (id) => console.log('View details for', id)
    },
    {
      label: 'Delete',
      icon: <Trash2 size={16} />,
      className: 'text-red-600',
      onClick: (id) => console.log('Delete', id)
    }
  ];

  // Handle client-side rendering for portal
  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const toggleMenu = (index, event) => {
    event.stopPropagation();
    
    if (activeMenu === index) {
      setActiveMenu(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      // Calculate left position, ensuring it doesn't go off-screen
      const leftPosition = Math.max(10, rect.left - 160);
      
      setMenuPosition({
        top: rect.bottom + window.scrollY + 5, // Add a small offset
        left: leftPosition, // Position menu to the left, but not off-screen
      });
      setActiveMenu(index);
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeMenu !== null) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeMenu]);

  return (
    <div className="p-4 md:p-6"> {/* Add padding for mobile, more for md+ screens */}
      {/* Header with Back Button and Title */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/infrastructure/vps/products" className="hover:text-gray-600">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-lg md:text-xl font-semibold whitespace-nowrap">
            {loading ? (
              <div className="w-32 md:w-48 h-7 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              serverData?.hostname || 'Server Details'
            )}
          </h1>
        </div>

        {!loading && (
          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                serverStatus === 'running' ? 'bg-green-500' : 
                serverStatus === 'stopped' ? 'bg-red-500' : 
                serverStatus === 'suspended' ? 'bg-yellow-500' : 
                serverStatus === 'provisioning' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}></div>
              <div className="flex items-center gap-1">
                <span className="text-sm capitalize">{serverStatus}</span>
                {serverStatus === 'provisioning' && (
                  <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Server Specs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {loading ? (
          // Skeleton loading for server specs cards
          <>
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
                <div className="w-16 h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </>
        ) : (
          // Actual server specs cards
          <>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">CPU:</div>
              <div className="font-medium text-purple-600">
                {`x${serverData?.cpu_count || 1} ${serverData?.cpu_type || 'VCPU'}`}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">Memory:</div>
              <div className="font-medium text-purple-600">
                {`${(serverData?.memory_size || 1024) / 1024}GB`}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">Storage:</div>
              <div className="font-medium text-purple-600">
                {`${serverData?.disk_size || 20} GB SSD`}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">Location:</div>
              <div className="font-medium text-purple-600">
                {serverData?.location?.name || 'Unknown'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Usage Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          // Skeleton loading for usage metrics
          <>
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-5 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-16 h-10 bg-gray-200 rounded mb-1 animate-pulse"></div>
                <div className="w-32 h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
                <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </>
        ) : (
          // Actual usage metrics
          <>
            {/* CPU Usage */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 8h8v8H8V8z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="font-medium">CPU Usage</span>
              </div>
              <div className="text-4xl font-bold mb-1">{cpuAverage}%</div>
              <div className="text-sm text-gray-600">
                {cpuAverage < 5 ? 'Low' : cpuAverage < 30 ? 'Average' : 'High'} Daily usage
              </div>
              <div className="mt-4 -mx-4 h-32 overflow-hidden">
                <LineChart data={cpuStats} min={0} max={Math.max(10, Math.ceil(cpuAverage * 2))} />
              </div>
            </div>

            {/* RAM Usage */}
            {/* <div className="bg-white p-4 rounded-lg border display-none">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 8h8v8H8V8z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="font-medium">Ram Usage</span>
              </div>
              <div className="text-4xl font-bold mb-1">65%</div>
              <div className="text-sm text-gray-600">Average Daily usage</div>
              <div className="mt-4 -mx-4">
                <LineChart />
              </div>
            </div> */}

            {/* Network Usage */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 8h8v8H8V8z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="font-medium">Network Usage</span>
              </div>
              <div className="text-4xl font-bold mb-1">{networkAverage.total || 0} KB/s</div>
              <div className="text-sm text-gray-600">
                <span className="text-blue-500">↓ {networkAverage.read || 0} KB/s</span> | 
                <span className="text-green-500"> ↑ {networkAverage.write || 0} KB/s</span>
              </div>
              <div className="mt-4 -mx-4 h-32 overflow-hidden">
                <LineChart 
                  data={networkStats.map(item => ({
                    time: item.time,
                    usage: item.read + item.write
                  }))} 
                  min={0} 
                  max={Math.max(10, Math.ceil(networkAverage.total * 2))} 
                />
              </div>
            </div>

            {/* Disk Activity */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 8h8v8H8V8z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="font-medium">Disk Activity</span>
              </div>
              <div className="text-4xl font-bold mb-1">{diskAverage.total || 0} KB/s</div>
              <div className="text-sm text-gray-600">
                <span className="text-blue-500">↓ {diskAverage.read || 0} KB/s</span> | 
                <span className="text-green-500"> ↑ {diskAverage.write || 0} KB/s</span>
              </div>
              <div className="mt-4 -mx-4 h-32 overflow-hidden">
                <LineChart 
                  data={diskStats.map(item => ({
                    time: item.time,
                    usage: item.read + item.write
                  }))} 
                  min={0} 
                  max={Math.max(10, Math.ceil(diskAverage.total * 2))} 
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Server Details Section */}
      <div className="mt-8">
        {/* Server Actions - Placed above the tabbed content for better visibility */}
        {!loading && serverData && (
          <div className="mb-6">
            <ServerActions 
              serverId={params.id} 
              serverStatus={serverStatus}
              isSuspended={isSuspended}
              onActionComplete={(notification) => {
                setNotification(notification);
                // Optionally re-fetch server data or status if needed after an action
                // fetchServerData(); 
                // fetchServerStatus();
              }} 
            />
          </div>
        )}
        
        <h2 className="text-xl font-semibold mb-6 mt-6">Server Details</h2>
        
        {/* Main container for vertical tabs and content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Vertical Tab Navigation - full width on mobile, fixed on md+ */}
          <div className="w-full md:w-48 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('server-details')}
              className={`text-left px-4 py-2 rounded-md text-sm w-full ${
                activeTab === 'server-details' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              Server Details
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`text-left px-4 py-2 rounded-md text-sm w-full ${
                activeTab === 'transactions' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`text-left px-4 py-2 rounded-md text-sm w-full ${
                activeTab === 'emails' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              Emails
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 bg-white rounded-lg border">
            <div className="p-4 md:p-6">
              {activeTab === 'server-details' && (
                <>
                  <h3 className="text-lg font-semibold mb-6">Server Details</h3>
                  
                  {loading ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[...Array(8)].map((_, index) => (
                          <div key={index}>
                            <div className="w-24 h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="w-full md:w-40 h-5 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : serverData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                        <div>
                          <p className="text-sm text-gray-600">Server ID</p>
                          <p className="font-medium">{serverData.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Hostname</p>
                          <p className="font-medium">{serverData.hostname}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">IP Address</p>
                          <p className="font-medium">{serverData.primary_ip_address}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-medium">{serverData.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">OS Template</p>
                          <p className="font-medium">{serverData.os_template?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Created At</p>
                          <p className="font-medium">{new Date(serverData.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Test Server</p>
                          <p className={`font-medium ${serverData.is_test_server ? 'text-orange-600' : ''}`}>
                            {serverData.is_test_server ? 'Yes' : 'No'}
                          </p>
                        </div>
                        {serverData.terminate_at && (
                          <div>
                            <p className="text-sm text-gray-600">Termination Date</p>
                            <p className="font-medium text-red-600">{new Date(serverData.terminate_at).toLocaleString()}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Plan</p>
                          <p className="font-medium">{serverData.plan?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">User</p>
                          <p className="font-medium">{serverData.user?.name} ({serverData.user?.email})</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <div className={`font-medium flex items-center gap-1 ${ // Changed <p> to <div>
                            serverStatus === 'running' ? 'text-green-600' : 
                            serverStatus === 'stopped' ? 'text-red-600' : 
                            serverStatus === 'suspended' ? 'text-yellow-600' : 
                            serverStatus === 'provisioning' ? 'text-blue-600' : // Added blue for provisioning text
                            'text-gray-600'
                          }`}>
                            <span className="capitalize">{serverStatus}</span>
                            {serverStatus === 'provisioning' && (
                              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div> {/* Changed </p> to </div> */}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">No server data available</div>
                  )}
                </>
              )}

              {activeTab === 'transactions' && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">Transactions</h3>
                  
                  {loading ? (
                    // Skeleton loading for transactions
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : (
                    // Empty state for transactions
                    <div className="text-center py-12">
                      <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-600 mb-2">No Transactions Found</h4>
                      <p className="text-gray-500 mb-6">There are no transactions associated with this server yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'emails' && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">Emails {emails?.length > 0 ? `(${emails.length})` : ''}</h3>
                  
                  {emailsLoading ? (
                    // Skeleton loading for emails
                    <div className="space-y-4">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="w-full h-16 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : emails && Array.isArray(emails) && emails.length > 0 ? (
                    <div className="overflow-x-auto"> {/* Ensure this div handles the horizontal scroll */}
                      <div className="border rounded-lg overflow-hidden"> {/* This div remains as is, primarily for border and rounded corners */}
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {emails.map((email) => (
                              <tr 
                                key={email.id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleViewEmail(email)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{email.from_name}</div>
                                  <div className="text-sm text-gray-500">{email.from_email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {email.to}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 truncate max-w-xs">{email.subject}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(email.sent_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                  <button 
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewEmail(email);
                                    }}
                                  >
                                    <Eye size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {emailsTotal > pageSize && (
                        <div className="flex justify-center mt-4">
                          <Pagination 
                            currentPage={emailsCurrentPage} 
                            totalCount={emailsTotal}
                            pageSize={pageSize}
                            onPageChange={handleEmailPageChange}
                          />
                        </div>
                      )}
                    </div>
                    ) : (
                    // Empty state for emails
                    <div className="text-center py-12">
                      <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-600 mb-2">No Emails Found</h4>
                      <p className="text-gray-500 mb-6">There are no emails associated with this server yet.</p>

                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Portal for dropdown menu with higher z-index - no longer needed with Table component */}
      
      {/* Notification Modal */}
      <NotificationModal 
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        message={notification.message}
        type={notification.type}
        duration={3000}
      />

      {/* Email Viewer Modal */}
      <EmailViewerModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={selectedEmail}
      />
    </div>
  );
};

export default VPSServerPage;
