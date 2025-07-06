'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const ServerMetrics = ({ title, value, subtext, children }) => (
  <div className="p-4 bg-white rounded-lg shadow">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    </div>
    <div className="mt-4">
      {children}
    </div>
    <div className="text-2xl font-semibold mt-4">{value}</div>
    <div className="text-sm text-gray-500">{subtext}</div>
  </div>
);

const BackupRow = ({ date, status, daysAgo }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
    <div>
      <div className="font-medium">{date}</div>
      <div className="text-sm text-gray-500">{daysAgo}</div>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-gray-500">{status}</span>
      <button className="text-blue-500 hover:text-blue-600">
        <RefreshCw size={16} />
      </button>
    </div>
  </div>
);

const UsageGraph = ({ percentage }) => (
  <div className="relative w-full h-12">
    <div className="absolute inset-0 bg-[#f0f2f5] rounded-lg"></div>
    <div 
      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#4318FF] to-[#868CFF] rounded-lg transition-all duration-500"
      style={{ width: `${percentage}%` }}
    >
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/20"></div>
    </div>
  </div>
);

const StorageGauge = ({ percentage, usedSpace }) => (
  <div className="relative w-24 h-24">
    <div className="absolute inset-0">
      <div className="w-full h-full border-[12px] border-[#f0f2f5] rounded-full"></div>
      <div 
        className="absolute inset-0 border-[12px] border-[#4318FF] rounded-full"
        style={{ 
          clipPath: `polygon(0 0, 100% 0, 100% ${percentage}%, 0 ${percentage}%)`,
        }}
      ></div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
      {usedSpace}
    </div>
  </div>
);

export default function DedicatedServer() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/infrastructure" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Data Management Server (VPS)</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-sm text-gray-500">Online</span>
          </div>
        </div>
      </div>

      {/* Server Specs */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">CPU</div>
          <div className="font-medium">x1</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Memory</div>
          <div className="font-medium">6GB</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Storage</div>
          <div className="font-medium">120 GB SATA SSD</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Location</div>
          <div className="font-medium">Amsterdam, NL</div>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <ServerMetrics
          title="CPU Usage"
          value="12%"
          subtext="Good Daily usage"
        >
          <UsageGraph percentage={12} />
        </ServerMetrics>

        <ServerMetrics
          title="Ram Usage"
          value="65%"
          subtext="Average Daily usage"
        >
          <UsageGraph percentage={65} />
        </ServerMetrics>

        <ServerMetrics
          title="Bandwidth"
          value="30k bps"
          subtext="Average Daily usage"
        >
          <UsageGraph percentage={30} />
        </ServerMetrics>

        <ServerMetrics
          title="Storage Usage"
          value="58%"
          subtext="Used Space"
        >
          <div className="flex justify-center">
            <StorageGauge percentage={58} usedSpace="555 GB" />
          </div>
        </ServerMetrics>
      </div>

      {/* Server Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Server Details</h2>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            <BackupRow 
              date="21 Jan 2025, 8:15am"
              status="Scheduled"
              daysAgo="Last Backup"
            />
            <BackupRow 
              date="19 Jan 2025, 8:15am"
              status="Scheduled"
              daysAgo="2 days ago"
            />
            <BackupRow 
              date="19 Jan 2025, 8:15am"
              status="Scheduled"
              daysAgo="4 days ago"
            />
            <BackupRow 
              date="19 Jan 2025, 8:15am"
              status="Scheduled"
              daysAgo="6 days ago"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
