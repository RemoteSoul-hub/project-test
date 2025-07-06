'use client';

import { useState } from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';

export default function ApiKeyPage() {
  const [copied, setCopied] = useState(false);
  const apiKey = '8M9X2rZ3sAj5Tx4EB9Lyun62y4p8Z3';
  const clientId = '1901';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">API Key</h2>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            onClick={() => {}}
          >
            <RefreshCw size={16} />
            Regenerate Key
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-gray-600 mb-6">
            Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in 
            publicly accessible areas such as GitHub, client-side code, and so forth.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">ClientID:</span>
              <span className="font-mono">{clientId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Key:</span>
              <span className="font-mono">{apiKey}</span>
              <button 
                className="ml-2 p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                onClick={handleCopyKey}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 