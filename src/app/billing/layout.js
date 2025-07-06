'use client';

import { InvoiceProvider } from '@/contexts/InvoiceContext';

/**
 * Billing Layout
 * 
 * This layout wraps all billing-related pages with the InvoiceProvider
 * to enable sharing invoice data between the list and detail pages.
 */
export default function BillingLayout({ children }) {
  return (
    <InvoiceProvider>
      {children}
    </InvoiceProvider>
  );
}
