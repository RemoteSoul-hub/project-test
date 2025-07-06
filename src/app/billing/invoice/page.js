'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This page is a fallback for when a user tries to access /billing/invoice without a specific ID.
 * It automatically redirects back to the main billing page to show all invoices.
 */
export default function InvoiceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/billing');
  }, [router]);

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="text-lg">Redirecting to invoices list...</div>
    </div>
  );
}
