'use client';

import { useState } from 'react';

export default function IpLockdownPage() {
  const [selectedIPs, setSelectedIPs] = useState(['69.6.30.203']);

  const sampleIPs = [
    '69.6.30.203',
    '31.173.84.69',
    '185.116.203.228',
    '91.184.201.2',
    '128.0.203.86',
    '213.207.158.226'
  ];

  const handleIPToggle = (ip) => {
    setSelectedIPs(prev => 
      prev.includes(ip) 
        ? prev.filter(i => i !== ip)
        : [...prev, ip]
    );
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-2xl font-semibold mb-6">IP Lockdown</h2>
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Specify IP's/subnets you want to able to access the API in the box below. Make sure each IP/subnet 
            is on its own line. Subnets must be specified in CIDR notation (i.e. xxx.xxx.xxx.xxx/xx)
          </p>
          <p className="text-red-600 font-medium">
            You will not be able to access the API if no IP's are specified
          </p>
        </div>
        <div className="bg-white border rounded-lg overflow-hidden">
          {sampleIPs.map((ip) => (
            <div 
              key={ip}
              className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedIPs.includes(ip)}
                onChange={() => handleIPToggle(ip)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 font-mono">{ip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 