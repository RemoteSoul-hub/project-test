"use client";
import React, { useState, useEffect } from 'react'; // Import useEffect
import Table from '../components/table/Table';
import ApiService from '@/services/apiService'; // Import ApiService
import ServerService from '@/services/serverService';
import { Pencil, FileText, Monitor, Mail } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Server, Package, ArrowUp, ArrowDown } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

const MetricCard = ({ title, value, percentage, trend, data, chartLoading }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: false,
        grid: { display: false },
        border: { display: false }
      },
      y: {
        display: false,
        grid: { display: false },
        border: { display: false }
        // Removed min: 40 and max: 100 to allow auto-scaling
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    elements: {
      point: { radius: 0 },
      line: {
        tension: 0.5,
        borderWidth: 1.5,
      }
    }
  };

  const chartData = {
    labels: Array(24).fill(''),
    datasets: [{
      data: data || [75, 72, 68, 70, 72, 68, 65, 62, 60, 65, 68, 70, 68, 65, 62, 60, 58, 62, 65, 68, 65, 62, 60, 58],
      borderColor: trend === 'up' ? '#10B981' : '#EF4444',
      fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
        const color = trend === 'up' ? '16, 185, 129' : '239, 68, 68';
        gradient.addColorStop(0, `rgba(${color}, 0.1)`);
        gradient.addColorStop(1, `rgba(${color}, 0.02)`);
        return gradient;
      }
    }]
  };

  return (
    <div className="bg-white rounded-none md:rounded-xl p-4 md:p-6 border">
      {/* Top Section - Title and Actions */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {/* <button className="text-gray-400 hover:text-gray-600 text-2xl leading-none d-">...</button> */}
      </div>
      
      {/* Content Container */}
      <div className="flex">
        {/* Left Section - Amount and Percentage */}
        <div className="flex-1">
          <div className="text-[2.5rem] font-bold leading-none">{value}</div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? '↑' : '↓'}
              <span className="font-medium">{Math.abs(percentage)}%</span>
            </span>
            <span className="text-gray-600">vs last month</span>
          </div>
        </div>
        
        {/* Right Section - Chart */}
        <div className="w-1/2 h-24">
          {chartLoading ? (
            <div className="w-full h-full bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <Line options={options} data={chartData} />
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ children, variant = 'default', icon, onClick }) => {
  const baseClasses = "px-2 lg:px-4 py-1 md:py-2 rounded-none md:rounded-lg font-medium flex items-center gap-2 text-sm lg:text-base whitespace-nowrap";
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    default: "bg-white text-gray-700 border hover:bg-gray-50",
    outline: "border border-gray-200 text-gray-600 hover:bg-gray-50"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]}`}
      onClick={onClick}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
  </svg>
);

import ServerCard from '@/components/server/ServerCard';

const mockVpsData = [
  {
    user: "FXBO",
    createdDate: "3/02/2025 11:01",
    hostName: "HostName1234",
    productId: "123456",
    cpu: "X2",
    ram: "4GB",
    storage: "120 GB",
    location: "Amsterdam, NL",
    status: "active",
  },
  {
    user: "FXB1",
    createdDate: "3/02/2025 11:01",
    hostName: "HostName1235",
    productId: "123457",
    cpu: "X2",
    ram: "4GB",
    storage: "120 GB",
    location: "Amsterdam, NL",
    status: "active",
  },
  {
    user: "FXB2",
    createdDate: "3/02/2025 11:01",
    hostName: "HostName1238",
    productId: "123458",
    cpu: "X2",
    ram: "4GB",
    storage: "120 GB",
    location: "Amsterdam, NL",
    status: "active",
  },
];

// Remove old mock vpsColumns definition

const actions = [
  {
    label: 'Edit Client',
    icon: <Pencil size={16} className="mr-2" />,
    onClick: (userId) => {
      router.push(`/users/${userId}`);
    },
  },
  {
    label: 'Invoices',
    icon: <FileText size={16} className="mr-2" />,
    onClick: () => console.log('Invoices clicked'),
  },
  {
    label: 'Login as Client',
    icon: <Monitor size={16} className="mr-2" />,
    onClick: () => console.log('Login as Client clicked'),
  },
  {
    label: 'Email Templates',
    icon: <Mail size={16} className="mr-2" />,
    onClick: () => console.log('Email Templates clicked'),
  },
];

// Remove old mock dedicatedServerColumns definition

const dedicatedServerData = [];

/**
 * Main Dashboard Page
 * 
 * This component serves as the homepage of the application.
 * It demonstrates the layout with various UI elements like cards, stats, and a chart.
 */
export default function Home() {
  const router = useRouter();
  
  // State for VPS data
  const [vpsData, setVpsData] = useState([]);
  const [vpsLoading, setVpsLoading] = useState(true);
  const [vpsError, setVpsError] = useState(null);
  // vpsCount will be set from statsData
  const [vpsChartData, setVpsChartData] = useState([]);
  // vpsChartError will be set from statsData fetch if needed, or removed if chart data comes from stats


  // State for Dedicated server data
  const [dedicatedData, setDedicatedData] = useState([]);
  const [dedicatedLoading, setDedicatedLoading] = useState(true);
  const [dedicatedError, setDedicatedError] = useState(null);
  // dedicatedCount will be set from statsData
  const [dedicatedChartData, setDedicatedChartData] = useState([]);
  // dedicatedChartError will be set from statsData fetch if needed, or removed if chart data comes from stats

  // State for stats API data
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  
  // State for counts to be displayed on cards, derived from statsData
  const [vpsCount, setVpsCount] = useState(0);
  const [dedicatedCount, setDedicatedCount] = useState(0);
  const [softwareUsersCount, setSoftwareUsersCount] = useState(0); // New state for software users


  // Static chart data for Software Users (no activity)
  const softwareUsersStaticChartData = Array(24).fill(0); // Flat line at y-axis 0

  // Shared data transformation logic (similar to overview pages)
  const transformServerData = (server) => ({
    id: server.id,
    user: server.user?.name || server.user?.username || 'Unknown',
    label: server.hostname,
    ip: server.primary_ip_address || 'Not assigned', // Add IP address
    created: new Date(server.created_at).toLocaleDateString(), // Keep original date string if needed elsewhere
    createdTimestamp: server.created_at, // Add full timestamp
    cpu: {
      count: typeof server.cpu_count === 'number' ? server.cpu_count : 'Unknown',
      type: server.cpu_type || 'N/A'
    },
    ram: typeof server.plan?.memory_size === 'number' ? `${(server.plan.memory_size / 1024).toFixed(0)} GB` : 'Unknown',
    storage: typeof server.plan?.disk_size === 'number' ? `${server.plan.disk_size} GB` : 'Unknown',
    location: server.location?.name || 'Unknown',
    status: 'loading' // Set initial status to loading
  });

  // Fetch server statuses
  const fetchServerStatuses = async (servers, setServerData) => {
    if (!servers || servers.length === 0) return;
    
    // Create a copy of the current server data
    const updatedServerData = [...servers];
    
    // Create an array of promises for fetching status
    const statusPromises = servers.map(async (server, index) => {
      try {
        const response = await ServerService.getStatus(server.id);
        // Update the status in our copy
        if (response && response.data && response.data.status) {
          updatedServerData[index] = {
            ...updatedServerData[index],
            status: response.data.status
          };
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
      // Wait for all status fetches to complete
      await Promise.all(statusPromises);
      
      // Update the state with all statuses
      setServerData(updatedServerData);
    } catch (error) {
      console.error("Error updating server statuses:", error);
      // Still update the UI with what we have to prevent freezing
      setServerData(updatedServerData);
    }
  };

  useEffect(() => {
    let isComponentMounted = true;
    
    const fetchData = async () => {
      // Fetch VPS Data
      setVpsLoading(true);
      try {
        const vpsResponse = await ApiService.get('/servers', { 'filter[type]': 'virtual', per_page: 5 }); // Limit to 5 for dashboard
        const transformedVpsData = vpsResponse.data.map(transformServerData);
        
        if (isComponentMounted) {
          setVpsData(transformedVpsData);
          // Removed: setVpsCount(vpsResponse.meta?.total || 0); - Count now comes from /stats
          setVpsError(null);
          
          // Fetch VPS statuses after data is loaded
          if (transformedVpsData.length > 0) {
            fetchServerStatuses(transformedVpsData, setVpsData);
          }
        }
      } catch (err) {
        console.error('Error fetching VPS data:', err);
        if (isComponentMounted) {
          setVpsError(err.message || 'Failed to load VPS data');
          setVpsData([]);
          setVpsCount(0);
        }
      } finally {
        if (isComponentMounted) {
          setVpsLoading(false);
        }
      }

      // Fetch Dedicated Data
      setDedicatedLoading(true);
      try {
        const dedicatedResponse = await ApiService.get('/servers', { 'filter[type]': 'dedicated', per_page: 5 }); // Limit to 5 for dashboard
        const transformedDedicatedData = dedicatedResponse.data.map(transformServerData);
        
        if (isComponentMounted) {
          setDedicatedData(transformedDedicatedData);
          // Removed: setDedicatedCount(dedicatedResponse.meta?.total || 0); - Count now comes from /stats
          setDedicatedError(null);
          
          // Fetch Dedicated statuses after data is loaded
          if (transformedDedicatedData.length > 0) {
            fetchServerStatuses(transformedDedicatedData, setDedicatedData);
          }
        }
      } catch (err) {
        console.error('Error fetching Dedicated data:', err);
        if (isComponentMounted) {
          setDedicatedError(err.message || 'Failed to load Dedicated data');
          setDedicatedData([]);
          setDedicatedCount(0);
        }
      } finally {
        if (isComponentMounted) {
          setDedicatedLoading(false);
        }
      }

      // Fetch Stats Data (which includes counts and chart data)
      // AND User count
      setStatsLoading(true); // We can reuse statsLoading for the user count as well or add a new one.
      try {
        // Fetch total users
        const usersResponse = await ApiService.get('/users', { per_page: 1 }); // Fetch only 1 to get meta.total
        if (isComponentMounted) {
          setSoftwareUsersCount(usersResponse.meta?.total || 0);
        }
      } catch (err) {
        console.error('Error fetching total users:', err);
        if (isComponentMounted) {
          setSoftwareUsersCount(0); // Fallback on error
        }
      }

      try {
        const response = await ApiService.get('/stats'); // Raw response from ApiService
        if (isComponentMounted) {
          const statsPayload = response.data; // Extract the actual payload, assuming it's in response.data

          if (!statsPayload) {
            console.error('Stats API response does not contain a data payload.');
            setStatsError('Invalid data structure from stats API');
            setVpsCount(0); // Fallback count
            setDedicatedCount(0); // Fallback count
            setVpsChartData(Array(24).fill(40)); // Fallback chart data
            setDedicatedChartData(Array(24).fill(40)); // Fallback chart data
          } else {
            setStatsData(statsPayload); // Store the actual payload
            setVpsCount(statsPayload.today_count || 0);
            setDedicatedCount(statsPayload.today_dedi_count || 0);

            // Process server_count for VPS chart
            if (statsPayload.server_count && Object.keys(statsPayload.server_count).length > 0) {
              const serverCountObj = statsPayload.server_count;
              const serverDates = Object.keys(serverCountObj).sort((a, b) => new Date(a) - new Date(b));
              const serverValues = serverDates.map(date => serverCountObj[date]);
              const slicedValues = serverValues.slice(-24);
              setVpsChartData(slicedValues.length > 0 ? slicedValues : Array(24).fill(40));
            } else {
              console.warn('statsPayload.server_count is missing or empty, using fallback chart data for VPS.');
              setVpsChartData(Array(24).fill(40)); // Fallback
            }

            // Process dedi_server_count for Dedicated chart
            if (statsPayload.dedi_server_count && Object.keys(statsPayload.dedi_server_count).length > 0) {
              const dediServerCountObj = statsPayload.dedi_server_count;
              const dediServerDates = Object.keys(dediServerCountObj).sort((a, b) => new Date(a) - new Date(b));
              const dediServerValues = dediServerDates.map(date => dediServerCountObj[date]);
              const slicedDediValues = dediServerValues.slice(-24);
              setDedicatedChartData(slicedDediValues.length > 0 ? slicedDediValues : Array(24).fill(40));
            } else {
              console.warn('statsPayload.dedi_server_count is missing or empty, using fallback chart data for Dedicated.');
              setDedicatedChartData(Array(24).fill(40)); // Fallback
            }
            setStatsError(null);
          }
        }
      } catch (err) {
        console.error('Error fetching stats data:', err);
        if (isComponentMounted) {
          setStatsError(err.message || 'Failed to load stats data');
          setVpsCount(0);
          setDedicatedCount(0);
          setVpsChartData(Array(24).fill(40));
          setDedicatedChartData(Array(24).fill(40));
        }
      } finally {
        if (isComponentMounted) {
          setStatsLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isComponentMounted = false;
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Define columns for VPS Table (using transformed data structure)
  const vpsColumns = [
    { accessor: 'user', header: 'User' },
    { 
      accessor: 'created', 
      header: 'Created',
      cell: (value, row) => { // Updated cell renderer for Created
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
      cell: (value, row) => (
        <Link href={`/infrastructure/vps/products/${row.id}`} className="text-blue-600 hover:underline">
          {value}
        </Link>
      )
    },
    { accessor: 'ip', header: 'IP' }, // Added IP column
    {
      accessor: 'cpu',
      header: 'CPU',
      cell: (value) => { // CPU cell renderer
        const hasCount = typeof value.count === 'number';
        const hasType = value.type && value.type !== 'N/A';
        if (value.count === 0 && !hasType) return <div>Unknown CPU</div>;
        if (!hasCount && !hasType) return <div>Unknown CPU</div>;
        return (
          <div>
            {hasCount && <div>{value.count} {value.count === 1 ? 'Core' : 'Cores'}</div>}
            {hasType && <div className="text-sm text-gray-500">{value.type}</div>}
          </div>
        );
      }
    },
    { accessor: 'ram', header: 'RAM' },
    { accessor: 'storage', header: 'Storage' },
    { accessor: 'location', header: 'Location' },
    {
      accessor: 'status',
      header: 'Status',
      cell: (value) => {
        // Status indicator styles based on status value
        let statusColor = 'bg-gray-500'; // Default color
        let statusText = 'Unknown';
        
        if (value === 'loading') {
          return (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
              <span>Loading...</span>
            </div>
          );
        } else if (value === 'error') {
          statusColor = 'bg-red-500';
          statusText = 'Error';
        } else {
          // Map API status values to display values
          switch(value) {
            case 'stopped':
              statusColor = 'bg-red-500';
              statusText = 'Stopped';
              break;
            case 'running':
              statusColor = 'bg-green-500';
              statusText = 'Running';
              break;
            case 'provisioning':
              statusColor = 'bg-yellow-500';
              statusText = 'Provisioning';
              break;
            case 'suspended':
              statusColor = 'bg-orange-500';
              statusText = 'Suspended';
              break;
            default:
              statusText = value.charAt(0).toUpperCase() + value.slice(1);
          }
        }
        
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
            <span>{statusText}</span>
          </div>
        );
      }
    },
    // Add actions column if needed, similar to overview pages
  ];

  // Define columns for Dedicated Server Table (same structure)
  const dedicatedColumns = [
    { accessor: 'user', header: 'User' },
    { 
      accessor: 'label', 
      header: 'Label',
      cell: (value, row) => (
        <Link href={`/infrastructure/dedicated/products/${row.id}`} className="text-blue-600 hover:underline">
          {value}
        </Link>
      )
    },
    { accessor: 'created', header: 'Created' },
    {
      accessor: 'cpu',
      header: 'CPU',
      cell: (value) => { // CPU cell renderer
        const hasCount = typeof value.count === 'number';
        const hasType = value.type && value.type !== 'N/A';
        if (value.count === 0 && !hasType) return <div>Unknown CPU</div>;
        if (!hasCount && !hasType) return <div>Unknown CPU</div>;
        return (
          <div>
            {hasCount && <div>{value.count} {value.count === 1 ? 'Core' : 'Cores'}</div>}
            {hasType && <div className="text-sm text-gray-500">{value.type}</div>}
          </div>
        );
      }
    },
    { accessor: 'ram', header: 'RAM' },
    { accessor: 'storage', header: 'Storage' },
    { accessor: 'location', header: 'Location' },
    {
      accessor: 'status',
      header: 'Status',
      cell: (value) => {
        // Status indicator styles based on status value
        let statusColor = 'bg-gray-500'; // Default color
        let statusText = 'Unknown';
        
        if (value === 'loading') {
          return (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
              <span>Loading...</span>
            </div>
          );
        } else if (value === 'error') {
          statusColor = 'bg-red-500';
          statusText = 'Error';
        } else {
          // Map API status values to display values
          switch(value) {
            case 'stopped':
              statusColor = 'bg-red-500';
              statusText = 'Stopped';
              break;
            case 'running':
              statusColor = 'bg-green-500';
              statusText = 'Running';
              break;
            case 'provisioning':
              statusColor = 'bg-yellow-500';
              statusText = 'Provisioning';
              break;
            case 'suspended':
              statusColor = 'bg-orange-500';
              statusText = 'Suspended';
              break;
            default:
              statusText = value.charAt(0).toUpperCase() + value.slice(1);
          }
        }
        
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
            <span>{statusText}</span>
          </div>
        );
      }
    },
     // Add actions column if needed, similar to overview pages
  ];

  // Sample data for the chart (Note: softwareUsersData, vpsOnlineData, serversOnlineData are removed as chart data is now fetched or static)
  const data = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 900 },
  ];

  // Navigate to VPS overview page
  const navigateToVpsOverview = () => {
    router.push('/infrastructure/vps/overview');
  };

  return (
    <>
      <div className="space-y-3 md:space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome back to your dashboard</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <MetricCard 
            title="Users" 
            value={softwareUsersCount} // Use the fetched count
            percentage={0} 
            trend="up" // Kept trend as "up" with 0% to maintain design, adjust if needed
            data={softwareUsersStaticChartData} // Use static flat line data
            chartLoading={statsLoading} // Reuse statsLoading or add a specific one if needed
          />
          <MetricCard 
            title="VPS Count" 
            value={vpsCount} // From API
            percentage={0} // Hardcoded as API for count doesn't provide this
            trend="up"     // Hardcoded
            data={vpsChartData} // From API (or simulated fetch)
            chartLoading={statsLoading} // Pass statsLoading state
          />
          <MetricCard 
            title="Dedicated Count" 
            value={dedicatedCount} // From API
            percentage={0} // Hardcoded
            trend="up"     // Hardcoded
            data={dedicatedChartData} // From API (or simulated fetch)
            chartLoading={statsLoading} // Pass statsLoading state
          />
        </div>

        {/* Dedicated Servers Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Dedicated Servers</h2>
            <div className="flex flex-wrap gap-2">
              {/* Removed Launch Server button */}
            </div>
          </div>
          {/* Dedicated Server Loading/Error/Data Handling */}
          {dedicatedLoading ? (
            <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>
          ) : dedicatedError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">Error: {dedicatedError}</div>
          ) : dedicatedData.length > 0 ? (
            <Table columns={dedicatedColumns} data={dedicatedData} /> // Use fetched data and new columns
          ) : (
            <ServerCard
              title="Launch a Dedicated Server"
              description="Our Dedicated Forex Server handles all intense and complex trading strategies. Harness powerful Inter processing power and dedicated resources today!"
              gradient="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800"
              actionButton="Get Started Now"
              opensContactSalesModal={true} // Add this prop
            />
          )}
        </div>

        {/* Virtual Private Servers Section */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Virtual Private Servers</h2>
            <div className="flex flex-wrap gap-2">
              {/* Removed Create a VPS button */}
            </div>
          </div>
          {/* VPS Loading/Error/Data Handling */}
          {vpsLoading ? (
            <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>
          ) : vpsError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">Error: {vpsError}</div>
          ) : vpsData.length > 0 ? (
            <Table columns={vpsColumns} data={vpsData} /> // Use fetched data and new columns
          ) : (
            <ServerCard
              title="Create a VPS"
              description="Our VPS servers, co-located in financial data centers, deliver ultra low latency and fast execution speed for forex trading"
              gradient="bg-gradient-to-br from-purple-900 via-indigo-900 to-indigo-800"
              actionButton="Get Started Now"
              opensContactSalesModal={true} // Add this prop
            />
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Stat Card Component
 * 
 * Displays a statistic with title, value, and change indicator.
 */
function StatCard({ title, value, change, isPositive, icon }) {
  return (
    <div className="bg-white p-2 md:p-4 rounded-none md:rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <div className="flex items-center mt-2">
            <span className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'} flex items-center`}>
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {change}
            </span>
            <span className="text-xs text-gray-400 ml-1">vs last month</span>
          </div>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

/**
 * Activity Item Component
 * 
 * Displays a single activity item with title, description, and time.
 */
function ActivityItem({ title, description, time }) {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </div>
  );
}
