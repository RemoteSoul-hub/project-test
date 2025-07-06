'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const InvoiceContext = createContext(undefined);

// Provider component
export function InvoiceProvider({ children }) {
  // Initialize with data from localStorage if available
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Load saved invoice data from localStorage on component mount
  useEffect(() => {
    try {
      const savedInvoice = localStorage.getItem('selectedInvoice');
      if (savedInvoice) {
        setSelectedInvoice(JSON.parse(savedInvoice));
      }
    } catch (error) {
      console.error('Error loading invoice from localStorage:', error);
    }
  }, []);

  // Function to set the selected invoice data and persist to localStorage
  const setInvoiceData = (invoice) => {
    setSelectedInvoice(invoice);
    
    try {
      if (invoice) {
        localStorage.setItem('selectedInvoice', JSON.stringify(invoice));
      }
    } catch (error) {
      console.error('Error saving invoice to localStorage:', error);
    }
  };

  // Function to clear the selected invoice data from state and localStorage
  const clearInvoiceData = () => {
    setSelectedInvoice(null);
    try {
      localStorage.removeItem('selectedInvoice');
    } catch (error) {
      console.error('Error removing invoice from localStorage:', error);
    }
  };

  return (
    <InvoiceContext.Provider
      value={{ selectedInvoice, setInvoiceData, clearInvoiceData }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

// Custom hook to use the invoice context
export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
}
