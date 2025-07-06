'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye } from 'lucide-react'; // Import Eye icon
import ApiService from '../../services/apiService';
import Table from '../../components/table/Table';
import TableToolbar from '../../components/table/TableToolbar';
import FilterPanel from '../../components/table/FilterPanel';
import Modal from '../../components/Modal';
import Pagination from '../../components/table/Pagination'; // Using existing Pagination component

const EmailsPage = () => {
  const [emails, setEmails] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('sent_at'); // Default sort
  const [sortDirection, setSortDirection] = useState('desc'); // Default sort direction

  // For search suggestions in TableToolbar (optional, can be enhanced later)
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalSearchCount, setTotalSearchCount] = useState(0);

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filtersActive, setFiltersActive] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    to: '',
    subject: '',
  });

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filterButtonRef = useRef(null);
  const prevSearchTermRef = useRef(searchTerm);

  // Function to fetch email suggestions for the search dropdown
  const searchEmailsForDropdown = useCallback(async (search) => {
    if (!search || search.trim().length < 2) { // Minimum 2 chars to search for suggestions
      setSearchResults([]);
      setTotalSearchCount(0);
      setSearchLoading(false); // Ensure loading is false if we don't search
      return;
    }
    setSearchLoading(true);
    try {
      const params = {
        'filter[search]': search,
        page: 1,
        per_page: 5 // Fetch a small number of items for suggestions
      };
      const response = await ApiService.get('/emails', params);
      setSearchResults(response.data || []);
      // Assuming meta.total provides the count of all possible suggestions,
      // or use response.data.length if only current suggestions count is needed.
      setTotalSearchCount(response.meta?.total || response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching email suggestions:', error);
      setSearchResults([]);
      setTotalSearchCount(0);
    } finally {
      setSearchLoading(false);
    }
  }, []); // Empty dependency array as it doesn't depend on component state/props that change

  const fetchEmails = useCallback(async (page, search, sort, direction, filters) => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params['filter[search]'] = search; // General search term
      if (sort) {
        params.sort = direction === 'desc' ? `-${sort}` : sort;
      }

      // Add specific field filters
      if (filters.to) params['filter[to]'] = filters.to;
      if (filters.subject) params['filter[subject]'] = filters.subject;
      
      const response = await ApiService.get('/emails', params);
      setEmails(response.data || []);
      if (response.meta) {
        setTotalPages(response.meta.last_page || 1);
        setCurrentPage(response.meta.current_page || 1);
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setEmails([]);
      setTotalPages(1);
      // setError(error.message || 'Failed to fetch emails'); // Retain error display if needed
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect for fetching main data
  useEffect(() => {
    const searchTermChanged = prevSearchTermRef.current !== searchTerm;
    if (searchTermChanged && currentPage !== 1) {
      setCurrentPage(1);
      prevSearchTermRef.current = searchTerm;
      return; 
    }
    prevSearchTermRef.current = searchTerm;

    const debounceFetch = setTimeout(() => {
      fetchEmails(currentPage, searchTerm, sortField, sortDirection, activeFilters);
    }, 300);

    return () => clearTimeout(debounceFetch);
  }, [searchTerm, currentPage, sortField, sortDirection, activeFilters, fetchEmails]);

  // Effect for fetching search suggestions
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 1) {
      const debounceSearchSuggestions = setTimeout(() => {
        searchEmailsForDropdown(searchTerm);
      }, 300); // Debounce for suggestions
      return () => clearTimeout(debounceSearchSuggestions);
    } else {
      setSearchResults([]); // Clear suggestions if search term is empty or too short
      setTotalSearchCount(0);
      setSearchLoading(false); // Ensure loading is false
    }
  }, [searchTerm, searchEmailsForDropdown]);


  const handleSort = (field) => {
    setLoading(true);
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleApplyFilters = (newFilters) => {
    setLoading(true);
    setActiveFilters(newFilters);
    setFiltersActive(
      Object.values(newFilters).some(value => !!value)
    );
    setCurrentPage(1); // Reset to first page when filters change
    setIsFilterPanelOpen(false);
  };
  
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    // No need to reset current page here, useEffect handles it
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setLoading(true);
      setCurrentPage(page);
    }
  };

  const handleViewEmail = (email) => {
    setSelectedEmail(email);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmail(null);
  };

  const filterFields = [
    { name: 'to', label: 'To Email', type: 'text', placeholder: 'Filter by recipient' },
    { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Filter by subject' },
  ];

  const columns = React.useMemo(
    () => [
      {
        header: 'To',
        accessor: 'to',
        sortable: true, // Assuming API supports sorting by 'to'
        headerCell: () => (
          <div className="flex items-center cursor-pointer" onClick={() => handleSort('to')}>
            To {sortField === 'to' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        ),
      },
      {
        header: 'From',
        accessor: 'from_email',
        sortable: true, // Assuming API supports sorting by 'from_email'
        headerCell: () => (
          <div className="flex items-center cursor-pointer" onClick={() => handleSort('from_email')}>
            From {sortField === 'from_email' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        ),
      },
      {
        header: 'Subject',
        accessor: 'subject',
        sortable: true, // Assuming API supports sorting by 'subject'
        headerCell: () => (
          <div className="flex items-center cursor-pointer" onClick={() => handleSort('subject')}>
            Subject {sortField === 'subject' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        ),
      },
      {
        header: 'Sent At',
        accessor: 'sent_at',
        sortable: true, // Default sort field
        headerCell: () => (
          <div className="flex items-center cursor-pointer" onClick={() => handleSort('sent_at')}>
            Sent At {sortField === 'sent_at' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        ),
        cell: (value) => new Date(value).toLocaleString(), // Basic date formatting
      },
      {
        header: 'Actions',
        accessor: 'actions',
        cell: (value, row) => ( // accessor value is not used, row.original is used
          <button
            onClick={() => handleViewEmail(row)}
            className="text-blue-500 hover:text-blue-700 p-1" // Added padding for better click area
            aria-label="View email" // Accessibility
          >
            <Eye size={20} /> {/* Use Eye icon */}
          </button>
        ),
      },
    ],
    [sortField, sortDirection] // Add dependencies for sort indicators
  );
  
  // Simplified renderSearchResult for TableToolbar if used
   const renderSearchResult = (email) => (
    <div>
      <div className="font-medium">{email.subject}</div>
      <div className="text-sm text-gray-500">To: {email.to} | From: {email.from_email}</div>
    </div>
  );


  return (
      <div>
        <TableToolbar
          title="Sent Emails"
          search={{
            searchTerm,
            onSearch: handleSearchChange,
            results: searchResults,
            loading: searchLoading,
            totalCount: totalSearchCount,
            renderResult: renderSearchResult,
          }}
          filter={{
            onClick: () => setIsFilterPanelOpen(!isFilterPanelOpen),
            isActive: filtersActive,
            buttonRef: filterButtonRef,
          }}
          // AddNew and Download can be omitted or placeholder if not applicable for emails
        />
        
        <FilterPanel
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          filters={activeFilters}
          onApplyFilters={handleApplyFilters}
          filterFields={filterFields}
          buttonRef={filterButtonRef}
        />
        
        <Table columns={columns} data={emails} loading={loading} />
        
        {!loading && emails.length === 0 && <p className="text-center p-4">No emails found.</p>}

        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {isModalOpen && selectedEmail && (
          <Modal
            isOpen={isModalOpen}
            onClose={closeModal}
            title={`Email Subject: ${selectedEmail.subject}`}
            size="5xl" // Changed size from 3xl to 5xl for more width
            closeOnClickOutside={true}
            showBackdrop={false} // Add this line to disable backdrop
          >
            <div className="prose max-w-none"> {/* Removed p-4 from here */}
              <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
            </div>
          </Modal>
        )}
      </div>
  );
};

export default EmailsPage;
