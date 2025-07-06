'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VPSPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the overview page
    router.push('/infrastructure/vps/overview');
  }, [router]);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Redirecting to VPS Overview...</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Please wait while you are redirected to the VPS overview page.</p>
      </div>
    </div>
  );
}
