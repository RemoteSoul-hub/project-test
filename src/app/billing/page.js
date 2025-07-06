'use client';

import { useState, useRef, useEffect } from 'react';
import TableToolbar from '../../components/table/TableToolbar';
import Table from '../../components/table/Table';
import Pagination from '../../components/table/Pagination';
import { Eye, FileText, Check, Unlock, Trash2, MoreVertical, Server, HardDrive, Pencil } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ApiService from '../../services/apiService';
import { useInvoice } from '@/contexts/InvoiceContext';

export default function BillingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('invoices');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const pageSize = 10; // Number of items per page
  const { setInvoiceData } = useInvoice(); // Get the context function to set invoice data

  // Reset current page when changing tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

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

  // Hide Transactions and Credit tabs
  const filteredTabs = ['invoices'];

  // Update invoicesData mapping to handle complete response structure
  const [invoicesData, setInvoicesData] = useState([]);

  // Fetch invoices data from Laravel API
  useEffect(() => {
    if (activeTab === 'invoices') {
      const fetchInvoices = async () => {
        try {
          const response = await ApiService.request(`/partners/{partner}/invoices`);
          
          // Update date formatting to display as dd/mm/yyyy hh:mm:ss
          const mappedData = response.data.map(invoice => ({
            id: invoice.id,
            startDate: formatDateTime(invoice.start_date),
            endDate: formatDateTime(invoice.end_date),
            isPaid: invoice.is_paid,
            netAmount: invoice.net_amount,
            paidAt: invoice.paid_at ? formatDateTime(invoice.paid_at) : 'N/A',
            partnerId: invoice.partner_id,
            refunded: invoice.refunded,
            sentAt: invoice.sent_at ? formatDateTime(invoice.sent_at) : 'N/A',
            taxAmount: invoice.tax_amount,
            total: invoice.total,
            brandName: invoice.brand_name,
            brandAddress: invoice.brand_address,
            brandBillingEmail: invoice.brand_billing_email,
            brandTaxRate: invoice.brand_tax_rate,
            brandBankDetails: invoice.brand_bank_details,
            items: invoice.items.map(item => ({
              description: item.description,
              amount: item.amount,
              quantity: item.quantity,
              startDate: formatDateTime(item.start_date),
              endDate: formatDateTime(item.end_date)
            }))
          }));
          setInvoicesData(mappedData);
        } catch (error) {
          console.error('Error fetching invoices:', error);
        }
      };

      // Helper function to format date as dd/mm/yyyy hh:mm:ss
      const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return { date: 'N/A', time: 'N/A' };
        
        const dateObj = new Date(dateTimeString);
        
        // Format date as dd/mm/yyyy
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        
        // Format time as hh:mm:ss
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        const formattedTime = `${hours}:${minutes}:${seconds}`;
        
        return {
          date: formattedDate,
          time: formattedTime
        };
      };

      fetchInvoices();
    }
  }, [activeTab]);

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

  // Function to handle downloading of invoices
  const handleDownloadInvoice = async (invoice) => {
    try {
      // API call to download the invoice
      await ApiService.request(
        `/partners/{partner}/invoices/${invoice.id}/download`,
        {
          method: 'GET',
          responseType: 'blob', // Important for handling file downloads
        }
      )
      .then((response) => {
        // Create a blob URL for the PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // Create a link element to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Invoice-${invoice.id}.pdf`);
        document.body.appendChild(link);
        
        // Trigger the download and clean up
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.error('Error downloading invoice:', error);
        // Show a user-friendly error message
        alert('Failed to download the invoice. Please try again later.');
      });
    } catch (error) {
      console.error('Error in download function:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  // Custom dropdown menu component
  const DropdownMenu = ({ id, row, actions }) => {
    const isOpen = openDropdown === id;
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    
    // Track window size for responsive dropdown placement
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Calculate dropdown position based on screen size
    const getDropdownPosition = () => {
      if (windowWidth < 640) {
        // Position from right on mobile
        return { right: '0px', left: 'auto' };
      } else {
        // Default position for larger screens
        return { right: 'auto', left: '0px' };
      }
    };
    
    return (
      <div className="relative" ref={el => dropdownRefs.current[id] = el}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(isOpen ? null : id);
          }}
          className="p-2 rounded-full hover:bg-gray-200"
          aria-label="More options"
        >
          <MoreVertical size={18} />
        </button>
        
        {isOpen && (
          <div className="absolute mt-1 w-48 bg-white rounded-md shadow-lg z-50" 
            style={getDropdownPosition()}>
            <ul className="py-1">
              {actions.map((action, index) => (
                <li 
                  key={index}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm ${action.className || ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (action.label === 'View Invoice') {
                      setInvoiceData(row);
                      router.push(`/billing/invoice/${row.id}`);
                    } else if (action.label === 'Download Invoice') {
                      // Implement invoice download functionality
                      handleDownloadInvoice(row);
                    } else if (action.label === 'View VPS Server') {
                      router.push(`/infrastructure/vps/products/${row.productId || '1'}`);
                    } else if (action.label === 'Edit VPS') {
                      router.push(`/infrastructure/vps/products/${row.productId || '1'}/edit`);
                    } else if (action.label === 'View Dedicated Server') {
                      router.push(`/infrastructure/dedicated/products/${row.productId || '1'}`);
                    } else if (action.label === 'Edit Server') {
                      router.push(`/infrastructure/dedicated/products/${row.productId || '1'}/edit`);
                    } else {
                      action.onClick(row.id, row);
                    }
                    setOpenDropdown(null);
                  }}
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Ensure invoicesData is mapped correctly to table columns
  const invoicesColumns = [
    {
      header: 'Invoice #',
      accessor: 'id',
      width: 'w-24',
      cell: (value, row) => {
        return (
          <div className="flex flex-col">
            <Link 
              href={`/billing/invoice/${value}`} 
              className="text-blue-600 hover:underline mb-1 whitespace-nowrap"
              onClick={() => {
                setInvoiceData(row);
                // Also store specifically for this invoice ID
                try {
                  localStorage.setItem(`invoice-${value}`, JSON.stringify(row));
                } catch (err) {
                  console.warn('Failed to store invoice data in localStorage:', err);
                }
              }}
            >
              {value}
            </Link>
          </div>
        );
      }
    },
    {
      header: 'Date',
      accessor: 'startDate',
      width: 'w-32',
      cell: (value, row) => (
        <div className="whitespace-nowrap">
          <div>{row.startDate?.date || 'N/A'}</div>
          <div className="text-gray-500 text-xs hidden sm:block">{row.startDate?.time || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Company',
      accessor: 'brandName',
      hideOnMobile: true,
      width: 'w-40'
    },
    {
      header: 'Email Address',
      accessor: 'brandBillingEmail',
      hideOnMobile: true,
      width: 'w-48'
    },
    {
      header: 'Value',
      accessor: 'total',
      width: 'w-28',
      cell: (value) => (
        <span className="whitespace-nowrap">
          {typeof value === 'number' ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value) : value}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'isPaid',
      width: 'w-24',
      cell: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Paid' : 'Unpaid'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      width: 'w-20',
      cell: (value, row) => (
        <DropdownMenu 
          id={`invoice-${row.id}`} 
          row={row} 
          actions={[
            {
              label: 'View Invoice',
              icon: <Eye size={16} />,
              onClick: () => {
                const invoiceData = encodeURIComponent(JSON.stringify(row));
                router.push(`/billing/invoice/${row.id}?data=${invoiceData}`);
              }
            },
            {
              label: 'Download Invoice',
              icon: <FileText size={16} />,
              onClick: () => console.log('Download invoice')
            }
          ]}
        />
      )
    }
  ];

  // Columns for Transactions tab
  const transactionsColumns = [
    {
      header: 'Date & Time',
      accessor: 'date',
      cell: (value, row) => (
        <div>
          <div>{row.date}</div>
          <div className="text-gray-500 text-xs">{row.time}</div>
        </div>
      )
    },
    {
      header: 'Product ID',
      accessor: 'productId'
    },
    {
      header: 'Product Type',
      accessor: 'productType'
    },
    {
      header: 'Product Specification',
      accessor: 'productSpec'
    },
    {
      header: 'Value',
      accessor: 'value'
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (value, row) => (
        <DropdownMenu 
          id={`transaction-${row.id}`} 
          row={row} 
          actions={[
            {
              label: 'View Details',
              icon: <Eye size={16} />,
              onClick: () => console.log('View transaction details')
            },
            {
              label: 'Download Receipt',
              icon: <FileText size={16} />,
              onClick: () => console.log('Download transaction receipt')
            },
            ...(row.productType === 'Virtual Private Server' ? [
              {
                label: 'View VPS Server',
                icon: <Server size={16} />,
                onClick: () => {}
              },
              {
                label: 'Edit VPS',
                icon: <Pencil size={16} />,
                onClick: () => router.push(`/infrastructure/vps/products/${row.productId || '1'}/edit`)
              }
            ] : []),
            ...(row.productType === 'Dedicated Server' ? [
              {
                label: 'View Dedicated Server',
                icon: <HardDrive size={16} />,
                onClick: () => {}
              },
              {
                label: 'Edit Server',
                icon: <Pencil size={16} />,
                onClick: () => router.push(`/infrastructure/dedicated/products/${row.productId || '1'}/edit`)
              }
            ] : [])
          ]}
        />
      )
    }
  ];

  // Columns for Credit tab
  const creditColumns = [
    {
      header: 'Date & Time',
      accessor: 'date',
      cell: (value, row) => (
        <div>
          <div>{row.date}</div>
          <div className="text-gray-500 text-xs">{row.time}</div>
        </div>
      )
    },
    {
      header: 'Product ID',
      accessor: 'productId'
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod'
    },
    {
      header: 'Value',
      accessor: 'value'
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'Success' ? 'bg-green-100 text-green-800' : 
          value === 'Failed' || value === 'Fail' ? 'bg-red-100 text-red-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (value, row) => (
        <DropdownMenu 
          id={`credit-${row.id}`} 
          row={row} 
          actions={[
            {
              label: 'View Details',
              icon: <Eye size={16} />,
              onClick: () => console.log('View credit details')
            },
            {
              label: 'Download Receipt',
              icon: <FileText size={16} />,
              onClick: () => console.log('Download credit receipt')
            },
            {
              label: 'Delete',
              icon: <Trash2 size={16} />,
              className: 'text-red-600',
              onClick: () => console.log('Delete credit')
            }
          ]}
        />
      )
    }
  ];

  // Action buttons for each tab
  const getActionButtons = () => {
    if (activeTab === 'invoices') {
      return {
        addNew: {
          label: 'Add New',
          onClick: () => console.log('Add new invoice')
        },
        download: {
          onDownloadXLSX: () => console.log('Download XLSX'),
          onDownloadCSV: () => console.log('Download CSV')
        }
      };
    } else if (activeTab === 'credit') {
      return {
        addNew: {
          label: 'Add Credit',
          onClick: () => console.log('Add new credit')
        },
        download: {
          onDownloadXLSX: () => console.log('Download XLSX'),
          onDownloadCSV: () => console.log('Download CSV')
        }
      };
    } else {
      return {
        download: {
          onDownloadXLSX: () => console.log('Download XLSX'),
          onDownloadCSV: () => console.log('Download CSV')
        }
      };
    }
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'invoices':
        return invoicesData;
      case 'transactions':
        return transactionsData;
      case 'credit':
        return creditData;
      default:
        return [];
    }
  };

  // Calculate pagination values
  const calculatePagination = (data) => {
    const totalItems = data.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    
    // Ensure current page is within valid range
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    
    // Get paginated data
    const startIndex = (validCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedData = data.slice(startIndex, endIndex);
    
    return {
      totalItems,
      totalPages,
      currentPage: validCurrentPage,
      paginatedData
    };
  };

  // Get pagination data for current tab
  const currentData = getCurrentData();
  const { totalItems, totalPages, paginatedData } = calculatePagination(currentData);

  // No longer auto-redirecting from /billing to the first invoice 
  // We want to show the full billing page with all invoices instead

  return (
    <div className="w-full h-full max-w-full">
      <div className="px-2 sm:px-4 mb-2">
        <TableToolbar
          title="Billing"
          search={{
            searchTerm,
            onSearch: setSearchTerm,
            results: [],
            loading: false
          }}
          filter={{
            onClick: () => console.log('Filter clicked'),
            isActive: false
          }}
          {...getActionButtons()}
        />

        {/* Tabs */}
        <div className="border-b mt-2">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            {filteredTabs.includes('invoices') && (
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invoices'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Invoices
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Table content based on active tab */}
      {activeTab === 'invoices' && (
        <>
          <div className="overflow-x-auto w-full rounded-lg border border-gray-200 shadow-sm my-2">
            <div className="min-w-full">
              <Table
                columns={invoicesColumns}
                data={paginatedData}
              />
            </div>
          </div>
          <div className="px-2 sm:px-4 py-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </div>
        </>
      )}

      {activeTab === 'transactions' && null}

      {activeTab === 'credit' && null}
    </div>
  );
}