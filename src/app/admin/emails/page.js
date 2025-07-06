'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Eye, Calendar, Search, Filter, X, ChevronDown } from 'lucide-react';
import Table from '@/components/table/Table';
import AdminApiService from '@/services/adminApiService';
import { createPortal } from 'react-dom';
import { getAuthToken } from '@/services/AuthService';
import { useSession } from "next-auth/react";

export default function AdminEmailsPage() {
  const { data: session, status } = useSession(); // Keep session for token
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailDetails, setEmailDetails] = useState(null);
  const [loadingEmailDetails, setLoadingEmailDetails] = useState(false);
  
  const dropdownRefs = useRef({});
  const router = useRouter();

  // Fetch emails data
  useEffect(() => {
    async function fetchEmails() {
      try {
        setLoading(true);
        
        // Use the AuthService to get the token
        const token = session?.laravelApiToken;
        
        if (!token) {
          console.error('No authentication token found');
          return;
        }
        
        // Use the appropriate method from AdminApiService
        const response = await AdminApiService.getEmails(token, { page: currentPage });
        
        
        // Process the response - don't check for status code as the API service already handles errors
        if (response && response.data) {
          setEmails(response.data);
          setTotalPages(response.meta?.last_page || 1);
        } else {
          console.error('No data in email response');
        }
      } catch (error) {
        console.error('Error fetching emails:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEmails();
  }, [currentPage, session]);

  // For client-side rendering of portals
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Handle outside click for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown !== null) {
        const currentRef = dropdownRefs.current[openDropdown];
        if (currentRef && !currentRef.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Pagination handler
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Email modal handlers
  const fetchEmailDetails = async (emailId) => {
    try {
      setLoadingEmailDetails(true);
      const token = session?.laravelApiToken;
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const emailData = await AdminApiService.getEmail(token, emailId);
      setEmailDetails(emailData.data || emailData);
    } catch (error) {
      console.error('Error fetching email details:', error);
    } finally {
      setLoadingEmailDetails(false);
    }
  };

  const handleViewEmail = (email) => {
    setSelectedEmail(email);
    setEmailDetails(null); // Clear previous details
    setShowEmailModal(true);
    fetchEmailDetails(email.id);
  };

  const closeModal = () => {
    setShowEmailModal(false);
    setSelectedEmail(null);
    setEmailDetails(null);
  };

  // Custom dropdown menu component
  const DropdownMenu = ({ id, row, actions }) => {
    const isOpen = openDropdown === id;
    
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
        
        {isOpen && isMounted && createPortal(
          <div 
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white z-50"
            style={{
              top: '100%',
              right: 0,
              zIndex: 50,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            <ul className="py-1">
              {actions.map((action, index) => (
                <li 
                  key={index} 
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${action.className || ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(row);
                    setOpenDropdown(null);
                  }}
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
      </div>
    );
  };

  // Email Modal Component
  const EmailViewModal = () => {
    if (!showEmailModal || !isMounted) return null;

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };
    
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b p-4">
            <h2 className="text-xl font-semibold">Email Details</h2>
            <button 
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6">
            {loadingEmailDetails ? (
              <div className="flex justify-center p-8">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : emailDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">From</h3>
                    <p className="mt-1">
                      {emailDetails.from_name} &lt;{emailDetails.from_email}&gt;
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">To</h3>
                    <p className="mt-1">{emailDetails.to}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Subject</h3>
                    <p className="mt-1">{emailDetails.subject || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Sent At</h3>
                    <p className="mt-1">{formatDate(emailDetails.sent_at)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Email Content</h3>
                  <div 
                    className="mt-2 p-4 border rounded bg-gray-50"
                    style={{ minHeight: '200px' }}
                  >
                    {emailDetails.body ? (
                      <iframe 
                        srcDoc={emailDetails.body}
                        title="Email Content"
                        className="w-full h-[500px] border-0"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    ) : (
                      <p className="text-gray-500 italic">No content available</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">No email details available</p>
            )}
          </div>
          
          <div className="flex justify-end border-t p-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Table columns definition
  const columns = [
    {
      header: 'Date & Time',
      accessor: 'sent_at',
      sortable: true,
      cell: (value) => {
        const date = new Date(value);
        return (
          <div>
            <div>{date.toLocaleDateString()}</div>
            <div className="text-gray-500 text-xs">{date.toLocaleTimeString()}</div>
          </div>
        );
      }
    },
    {
      header: 'To',
      accessor: 'to',
      sortable: true
    },
    {
      header: 'From',
      accessor: 'from_email',
      cell: (value, row) => (
        <div>
          <div>{row.from_name}</div>
          <div className="text-gray-500 text-xs">{value}</div>
        </div>
      )
    },
    {
      header: 'Subject',
      accessor: 'subject',
      sortable: true
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (value, row) => (
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewEmail(row);
            }}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full"
            title="View Email"
          >
            <Eye size={18} />
          </button>
          
          {/* <DropdownMenu 
            id={`email-${row.id}`} 
            row={row} 
            actions={[
              {
                label: 'View Email',
                icon: <Eye size={16} />,
                onClick: handleViewEmail
              }
            ]}
          /> */}
        </div>
      )
    }
  ];

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Implement search functionality if API supports it
  };

  // Render pagination controls
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle area
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return (
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-2 py-1 text-gray-500 disabled:opacity-50"
        >
          &lt;
        </button>
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
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
          onClick={() => handlePageChange(currentPage + 1)}
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
        <h1 className="text-2xl font-semibold">Email Management</h1>
        <div className="flex gap-4 items-center">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search emails..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      {/* Emails table */}
      {loading ? (
        <div className="p-6 text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading emails...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table 
              columns={columns} 
              data={emails} 
              isLoading={loading}
            />
          </div>
          {renderPagination()}
        </>
      )}
      
      {/* Email View Modal */}
      <EmailViewModal />
    </div>
  );
}