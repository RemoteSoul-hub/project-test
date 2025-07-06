'use client';
import React, { useState } from 'react';
import { ChevronLeft, MonitorDot, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import StorageChart from '@/components/StorageChart';
import LineChart from '@/components/LineChart';

const DedicatedServerPage = () => {
  const [activeTab, setActiveTab] = useState('server-details');

  const mockTransactions = [
    { id: 'FXBO01', date: '12/02/2025', user: 'FBXO User', description: 'Monthly Bill', value: '€40.00' },
    { id: 'FXBO02', date: '12/02/2025', user: 'FBXO User', description: 'Monthly Bill', value: '€40.00' },
    { id: 'FXBO03', date: '12/02/2025', user: 'FBXO User', description: 'Monthly Bill', value: '€40.00' },
    { id: 'FXBO04', date: '12/02/2025', user: 'FBXO User', description: 'Monthly Bill', value: '€40.00' },
  ];

  return (
    <div className="p-6">
      {/* Header with Back Button and Title */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/infrastructure/dedicated/overview" className="hover:text-gray-600">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-semibold">Dedicated Server A</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm">Online</span>
        </div>
        <div className="ml-auto">
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <MonitorDot size={20} />
          </button>
        </div>
      </div>

      {/* Server Specs Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">CPU:</div>
          <div className="font-medium text-purple-600">1 × AMD Ryzen 5 7600</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Memory:</div>
          <div className="font-medium text-purple-600">16GB</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Storage:</div>
          <div className="font-medium text-purple-600">2 × 500 GB SATA SSD</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Location:</div>
          <div className="font-medium text-purple-600">Amsterdam, NL</div>
        </div>
      </div>

      {/* Usage Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* CPU Usage */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 8h8v8H8V8z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="font-medium">CPU Usage</span>
          </div>
          <div className="text-4xl font-bold mb-1">12%</div>
          <div className="text-sm text-gray-600">Good Daily usage</div>
          <div className="mt-4 -mx-4">
            <LineChart />
          </div>
        </div>

        {/* RAM Usage */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 8h8v8H8V8z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="font-medium">Ram Usage</span>
          </div>
          <div className="text-4xl font-bold mb-1">65%</div>
          <div className="text-sm text-gray-600">Average Daily usage</div>
          <div className="mt-4 -mx-4">
            <LineChart />
          </div>
        </div>

        {/* Bandwidth */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 8h8v8H8V8z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="font-medium">Bandwidth</span>
          </div>
          <div className="text-4xl font-bold mb-1">30k bps</div>
          <div className="text-sm text-gray-600">Average Daily usage</div>
          <div className="mt-4 -mx-4">
            <LineChart />
          </div>
        </div>

        {/* Storage Usage */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 8h8v8H8V8z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="font-medium">Storage Usage</span>
          </div>
          <div className="text-4xl font-bold mb-1">58%</div>
          <div className="text-sm text-gray-600 mb-4">Used Space</div>
          <div className="flex justify-center">
            <StorageChart usedSpace="555" totalSpace="1" />
          </div>
        </div>
      </div>

      {/* Server Details Section */}
      <div className="mt-8 flex gap-6">
        {/* Left Sidebar Navigation */}
        <div className="w-48 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('server-details')}
            className={`text-left px-4 py-2 rounded-md text-sm ${
              activeTab === 'server-details' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Server Details
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`text-left px-4 py-2 rounded-md text-sm ${
              activeTab === 'transactions' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`text-left px-4 py-2 rounded-md text-sm ${
              activeTab === 'emails' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Emails
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`text-left px-4 py-2 rounded-md text-sm ${
              activeTab === 'billing' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`text-left px-4 py-2 rounded-md text-sm ${
              activeTab === 'permissions' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Permissions
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`text-left px-4 py-2 rounded-md text-sm ${
              activeTab === 'backups' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Backups
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`text-left px-4 py-2 rounded-md text-sm ${
              activeTab === 'settings' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-white rounded-lg border">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Server Details</h2>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      <div className="flex items-center gap-1 cursor-pointer">
                        ID <ChevronDown size={16} />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      <div className="flex items-center gap-1 cursor-pointer">
                        Date <ChevronDown size={16} />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      <div className="flex items-center gap-1 cursor-pointer">
                        User <ChevronDown size={16} />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      <div className="flex items-center gap-1 cursor-pointer">
                        Description <ChevronDown size={16} />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                      <div className="flex items-center gap-1 cursor-pointer">
                        Value <ChevronDown size={16} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockTransactions.map((transaction, index) => (
                    <tr key={transaction.id} className="border-t">
                      <td className="px-4 py-3 text-sm">{transaction.id}</td>
                      <td className="px-4 py-3 text-sm">{transaction.date}</td>
                      <td className="px-4 py-3 text-sm">{transaction.user}</td>
                      <td className="px-4 py-3 text-sm">{transaction.description}</td>
                      <td className="px-4 py-3 text-sm">{transaction.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DedicatedServerPage;
