'use client';
import { useState } from 'react';
import Table from '@/components/table/Table'; // Adjust path if needed
import FilterButton from '@/components/table/FilterButton';
import { Download, Plus } from 'lucide-react';


export default function UserProfileProducts() {
  // For demonstration, use mock data.
  // Replace or fetch real data as needed.
  const [products] = useState([
    {
      id: 1,
      productName: 'Forex VPS Standard',
      dateCreated: '01/01/2025',
      status: 'Active',
      subscriptionType: 'Monthly',
    },
    {
      id: 2,
      productName: 'Dedicated Server Pro',
      dateCreated: '15/02/2025',
      status: 'Suspended',
      subscriptionType: 'Yearly',
    },
    {
      id: 3,
      productName: 'MT4 Bridge',
      dateCreated: '20/03/2025',
      status: 'Active',
      subscriptionType: 'Monthly',
    },
    {
      id: 4,
      productName: 'Hosting Lite',
      dateCreated: '05/04/2025',
      status: 'Cancelled',
      subscriptionType: 'Monthly',
    },
  ]);

  // Define columns for the Table component
  // accessor must match keys in your data objects
  const columns = [
    { header: 'Product', accessor: 'productName' },
    { header: 'Date Created', accessor: 'dateCreated' },
    { header: 'Status', accessor: 'status' },
    { header: 'Subscription', accessor: 'subscriptionType' },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Products</h2>
      <div className="flex justify-end items-center mb-4">
      {/* Buttons on the right */}
      <div className="flex gap-2">
        {/* Filter button */}
        <FilterButton />

        {/* Download button */}
        <button className="flex items-center gap-1 border px-3 py-2 rounded-md text-sm">
          <Download size={16} />
          Download
        </button>

        {/* Add New Product button */}
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
          Add New Product
        </button>
      </div>
    </div>

      {/* Reusable Table component */}
      <Table columns={columns} data={products} />
    </div>
  );
}
