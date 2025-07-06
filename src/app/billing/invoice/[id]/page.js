'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { ArrowLeft, Download, FileText, Table } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import ApiService from '../../../../services/apiService';
import { useInvoice } from '@/contexts/InvoiceContext';

export default function InvoiceDetailPage({ params }) {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use our invoice context instead of URL params
  const { selectedInvoice } = useInvoice();
  
  const unwrappedParams = use(params);
  const invoiceId = unwrappedParams.id;

  useEffect(() => {
    function loadInvoiceData() {
      try {
        setLoading(true);
        
        // Try to load invoice-specific data from localStorage first
        const savedInvoiceData = localStorage.getItem(`invoice-${invoiceId}`);
        if (savedInvoiceData) {
          try {
            const parsedInvoice = JSON.parse(savedInvoiceData);
            console.log(`Loaded invoice ${invoiceId} data from localStorage`);
            setInvoice(parsedInvoice);
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('Error parsing stored invoice data:', parseError);
            // Continue to next data source if parse error
          }
        }
        
        // If no invoice-specific data, try context data
        if (selectedInvoice) {
          // Store it specifically for this invoice ID for future refreshes
          try {
            localStorage.setItem(`invoice-${invoiceId}`, JSON.stringify(selectedInvoice));
          } catch (storageError) {
            console.warn('Could not store invoice in localStorage:', storageError);
          }
          
          // Get invoice data from context
          setInvoice(selectedInvoice);
          setLoading(false);
        } else {
          // Fallback: Try to fetch from API
          console.warn("Invoice data not provided in context or localStorage, trying API as fallback");
          fallbackFetchFromApi();
        }
      } catch (err) {
        console.error('Error loading invoice data:', err);
        setError('Failed to load invoice data. Please return to the invoice list and try again.');
        setLoading(false);
      }
    }
    
    // Test function to try fetching invoice data from the API
    async function testFetchInvoice() {
      try {
        console.log(`Testing API call to fetch invoice ${invoiceId} data...`);
        const response = await ApiService.request(`/api/v1/invoices/${invoiceId}`);
        console.log('API Response for test invoice fetch:', response);
        
        if (response && response.data) {
          console.log('Successfully fetched invoice data from API:', response.data);
        }
      } catch (error) {
        console.warn('Test API call failed:', error);
      }
    }
    
    async function fallbackFetchFromApi() {
      try {
        // Try the new API endpoint first
        try {
          console.log(`Attempting to fetch invoice data from new endpoint for invoice ${invoiceId}...`);
          const response = await ApiService.request(`/api/v1/invoices/${invoiceId}`);
          
          if (response && response.data) {
            console.log('Successfully fetched invoice data from API:', response.data);
            
            // Store the fetched data in localStorage for future refreshes
            try {
              localStorage.setItem(`invoice-${invoiceId}`, JSON.stringify(response.data));
            } catch (storageError) {
              console.warn('Could not store invoice in localStorage:', storageError);
            }
            
            setInvoice(response.data);
            return;
          }
        } catch (newApiError) {
          console.warn('New API endpoint failed:', newApiError);
          console.log('Falling back to legacy endpoint...');
        }
        
        // Fall back to original endpoint
        const response = await ApiService.request(`/partners/{partner}/invoices/${invoiceId}`);
        
        if (!response.data) {
          throw new Error('Invoice data not found');
        }
        
        // Store the fetched data in localStorage for future refreshes
        try {
          localStorage.setItem(`invoice-${invoiceId}`, JSON.stringify(response.data));
        } catch (storageError) {
          console.warn('Could not store invoice in localStorage:', storageError);
        }
        
        setInvoice(response.data);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Invoice data not available. Please return to the invoice list and try again.');
      } finally {
        setLoading(false);
      }
    }

    loadInvoiceData();
  }, [invoiceId, selectedInvoice]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  // Function to handle downloading an invoice
  const downloadInvoice = async (format = 'pdf') => {
    try {
      // Close the dropdown
      setDownloadOpen(false);
      
      // Determine the API endpoint based on format
      const endpoint = `/partners/{partner}/invoices/${invoiceId}/download${format === 'csv' ? '/csv' : ''}`;
      
      await ApiService.request(
        endpoint,
        {
          method: 'GET',
          responseType: 'blob',
        }
      )
      .then((response) => {
        // Create a blob URL for the file
        const contentType = format === 'pdf' ? 'application/pdf' : 'text/csv';
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        
        // Create a link element to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Invoice-${invoiceId}.${format}`);
        document.body.appendChild(link);
        
        // Trigger the download and clean up
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.error(`Error downloading invoice as ${format}:`, error);
        alert(`Failed to download the invoice as ${format.toUpperCase()}. Please try again later.`);
      });
    } catch (error) {
      console.error('Error in download function:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  // Helper function to safely access invoice fields regardless of API response format
  const getInvoiceField = (fieldPath, defaultValue = 'N/A') => {
    if (!invoice) return defaultValue;
    
    // Support for both camelCase and snake_case field names
    const paths = fieldPath.split('.');
    let result = invoice;
    
    // Try camelCase path first
    try {
      for (const path of paths) {
        if (result[path] === undefined) break;
        result = result[path];
      }
      
      if (result !== invoice && result !== undefined) {
        return result;
      }
    } catch (e) {
      // Continue to try snake_case
    }
    
    // Try snake_case path
    try {
      result = invoice;
      const snakePath = paths.map(p => 
        p.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      );
      
      for (const path of snakePath) {
        if (result[path] === undefined) break;
        result = result[path];
      }
      
      if (result !== invoice && result !== undefined) {
        return result;
      }
    } catch (e) {
      return defaultValue;
    }
    
    return defaultValue;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-lg">Loading invoice details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-lg">Invoice not found</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="flex items-center">
          <Link href="/billing" className="mr-4">
            <ArrowLeft className="text-gray-500" />
          </Link>
          <h1 className="text-xl font-medium">Invoice #{invoice.id}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 relative w-full sm:w-auto">
          <button
            onClick={() => setDownloadOpen(!downloadOpen)}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 border rounded-md bg-white"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Download</span>
          </button>
          {downloadOpen && (
            <div className="absolute right-0 top-12 bg-white border rounded-md shadow-md z-10">
              <ul className="py-1">
                <li 
                  onClick={() => downloadInvoice('pdf')} 
                  className="px-4 py-2 hover:bg-gray-100 flex items-center cursor-pointer"
                >
                  <FileText size={16} className="mr-2" />
                  <span>Download PDF</span>
                </li>
                <li 
                  onClick={() => downloadInvoice('csv')} 
                  className="px-4 py-2 hover:bg-gray-100 flex items-center cursor-pointer"
                >
                  <Table size={16} className="mr-2" />
                  <span>Download CSV</span>
                </li>
              </ul>
            </div>
          )}
          <button className={`px-4 py-2 ${invoice.isPaid || invoice.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-md font-medium`}>
            {invoice.isPaid || invoice.is_paid ? 'Paid' : 'Unpaid'}
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="w-full border shadow-md mx-auto">
        {/* Company Info */}
        <div className="flex flex-col md:flex-row justify-between p-4 sm:p-6 border-b gap-6">
          <div className="w-full md:w-1/2">
            <div className="text-lg font-semibold mb-4">
              {invoice.brandName || 'ThinkHuge'}
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Company Information</p>
              <p><span className="font-medium">Address:</span> {invoice.brandAddress || invoice.brand_address || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {invoice.brandBillingEmail || invoice.brand_billing_email || 'N/A'}</p>
              {invoice.brandTaxRate !== undefined && (
                <p><span className="font-medium">Tax Rate:</span> {invoice.brandTaxRate || invoice.brand_tax_rate}%</p>
              )}
              {invoice.brandVatNumber && (
                <p><span className="font-medium">VAT Number:</span> {invoice.brandVatNumber}</p>
              )}
              {invoice.brandCompanyNumber && (
                <p><span className="font-medium">Company Number:</span> {invoice.brandCompanyNumber}</p>
              )}
              {invoice.brandPhone && (
                <p><span className="font-medium">Phone:</span> {invoice.brandPhone}</p>
              )}
              {invoice.brandWebsite && (
                <p><span className="font-medium">Website:</span> {invoice.brandWebsite}</p>
              )}
            </div>
          </div>
          <div className="text-left md:text-right w-full md:w-1/2">
            <div className="font-medium text-lg mb-2">Tax Invoice</div>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Invoice #:</span> {invoice.id}</p>
              <p><span className="font-medium">Date:</span> {invoice.startDate?.date || formatDate(invoice.start_date)}</p>
              <p><span className="font-medium">Period:</span> {invoice.startDate?.date || formatDate(invoice.start_date)} - {invoice.endDate?.date || formatDate(invoice.end_date)}</p>
              <p><span className="font-medium">Status:</span> <span className={invoice.isPaid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{invoice.isPaid ? 'Paid' : 'Unpaid'}</span></p>
              {invoice.paidAt && invoice.paidAt !== 'N/A' && (
                <p><span className="font-medium">Paid Date:</span> {typeof invoice.paidAt === 'object' ? invoice.paidAt.date : formatDate(invoice.paidAt)}</p>
              )}
              {invoice.sentAt && invoice.sentAt !== 'N/A' && (
                <p><span className="font-medium">Sent Date:</span> {typeof invoice.sentAt === 'object' ? invoice.sentAt.date : formatDate(invoice.sentAt)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="p-4 sm:p-6 border-b">
          <div className="text-sm">
            <p className="font-medium mb-1">Bill To:</p>
            <p className="font-semibold text-base">{partner?.company_name || invoice.partnerCompanyName || 'Client'}</p>
            {invoice.partnerAddress && <p className="break-words">{invoice.partnerAddress}</p>}
            {invoice.partnerEmail && <p className="break-words">{invoice.partnerEmail}</p>}
            {invoice.partnerId && <p><span className="font-medium">Partner ID:</span> {invoice.partnerId}</p>}
            {invoice.partnerContact && <p className="break-words">{invoice.partnerContact}</p>}
          </div>
        </div>

        {/* Total */}
        <div className="text-right p-4 sm:p-6 border-b">
          <div className="text-lg sm:text-xl font-bold">Total (USD) {formatCurrency(invoice.total)}</div>
        </div>

        {/* Invoice Items */}
        <div className="overflow-x-auto border-b">
          <div className="min-w-[720px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 sm:p-3 text-left border-b">Description</th>
                  <th className="p-2 sm:p-3 text-left border-b">Period</th>
                  <th className="p-2 sm:p-3 text-left border-b">Qty</th>
                  <th className="p-2 sm:p-3 text-right border-b">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => {
                  // Handle both formats of dates (from API or from our formatted object)
                  const startDate = item.startDate ? 
                    (typeof item.startDate === 'object' ? item.startDate.date : formatDate(item.startDate)) :
                    formatDate(item.start_date);
                    
                  const endDate = item.endDate ? 
                    (typeof item.endDate === 'object' ? item.endDate.date : formatDate(item.endDate)) :
                    formatDate(item.end_date);
                    
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-2 sm:p-3 border-b">{item.description}</td>
                      <td className="p-2 sm:p-3 border-b whitespace-nowrap">
                        {startDate} - {endDate}
                      </td>
                      <td className="p-2 sm:p-3 border-b text-center">{item.quantity}</td>
                      <td className="p-2 sm:p-3 border-b text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="p-2 sm:p-3 text-right font-medium border-t">Net Amount:</td>
                  <td className="p-2 sm:p-3 text-right font-medium border-t">{formatCurrency(invoice.net_amount)}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="p-2 sm:p-3 text-right font-medium">Tax:</td>
                  <td className="p-2 sm:p-3 text-right font-medium">{formatCurrency(invoice.tax_amount)}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="p-2 sm:p-3 text-right font-bold">Total:</td>
                  <td className="p-2 sm:p-3 text-right font-bold">{formatCurrency(invoice.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment Info */}
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="font-medium text-lg">Payment Details</h3>
          </div>
          
          <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
            <h4 className="font-medium mb-2">Bank Information</h4>
            
            {/* Display bank details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
              {(invoice.brandBankDetails || invoice.brand_bank_details) && (
                <>
                  <div className="col-span-1 md:col-span-2">
                    <p className="whitespace-pre-wrap break-words">{invoice.brandBankDetails || invoice.brand_bank_details}</p>
                  </div>
                </>
              )}
              
              {/* Display additional banking info if available */}
              {invoice.brandBankName && (
                <>
                  <div><span className="font-medium">Bank Name:</span></div>
                  <div>{invoice.brandBankName}</div>
                </>
              )}
              
              {invoice.brandBankAccountName && (
                <>
                  <div><span className="font-medium">Account Name:</span></div>
                  <div>{invoice.brandBankAccountName}</div>
                </>
              )}
              
              {invoice.brandBankAccountNumber && (
                <>
                  <div><span className="font-medium">Account Number:</span></div>
                  <div>{invoice.brandBankAccountNumber}</div>
                </>
              )}
              
              {invoice.brandBankSortCode && (
                <>
                  <div><span className="font-medium">Sort Code:</span></div>
                  <div>{invoice.brandBankSortCode}</div>
                </>
              )}
              
              {invoice.brandSwiftBic && (
                <>
                  <div><span className="font-medium">SWIFT/BIC:</span></div>
                  <div>{invoice.brandSwiftBic}</div>
                </>
              )}
              
              {invoice.brandIban && (
                <>
                  <div><span className="font-medium">IBAN:</span></div>
                  <div>{invoice.brandIban}</div>
                </>
              )}
            </div>
            
            {/* Payment terms and reference */}
            <div className="border-t pt-3 mt-3">
              <p className="text-sm mb-2"><span className="font-medium">Payment Terms:</span> Due on Receipt</p>
              <p className="text-sm mb-2"><span className="font-medium">Payment Reference:</span> INV-{invoice.id}</p>
              {invoice.refunded && invoice.refunded !== "0.00" && parseFloat(invoice.refunded) !== 0 && (
                <p className="text-sm text-orange-600 font-medium">This invoice has been refunded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}