'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'; // Import usePathname
import { Copy, RefreshCw, Check, Plus, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import JsonViewer from '@/components/JsonViewer';
// import apiSpec from '@/../api.json'; // Import the JSON data - REMOVED
// import SwaggerUIWithErrorSuppression from "@/components/SwaggerUIWithErrorSuppression"; // Import our Swagger UI component with error suppression - REMOVED
import ApiService from '@/services/apiService'; // Import ApiService
import Modal from '@/components/Modal'; // Import Modal component

export default function IntegrationsPage() {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState(''); // State to store current hash

  useEffect(() => {
    // Set initial hash on component mount
    setCurrentHash(window.location.hash);

    // Listen for hash changes
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);

    // Cleanup listener
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const [copiedKey, setCopiedKey] = useState(null);
  const [selectedIPs, setSelectedIPs] = useState(['69.6.30.203']);
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [deletingKeyId, setDeletingKeyId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);

  // TODO: Remove hardcoded values once API integration is complete
  const apiKey = '8M9X2rZ3sAj5Tx4EB9Lyun62y4p8Z3';
  const clientId = '1901';

  const sampleIPs = [
    '69.6.30.203',
    '31.173.84.69',
    '185.116.203.228',
    '91.184.201.2',
    '128.0.203.86',
    '213.207.158.226'
  ];

  // Hide IP Lockdown menu item for now
  const menuItems = [
    { label: 'Welcome', href: '#welcome' },
    { label: 'API Key', href: '#api-key' },
    // { label: 'IP Lockdown', href: '#ip-lockdown' }, // Hidden until API implementation
    { label: 'API Documentation', href: '#api-docs' }
  ];

  useEffect(() => {
    const fetchApiKeys = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await ApiService.get('/api_keys');
        const keys = response?.data || [];
        setApiKeys(keys);
      } catch (err) {
        console.error("Error fetching API keys:", err);
        setError(err.message || 'Failed to fetch API keys.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  // Function to refresh the API keys list
  const fetchApiKeys = async () => {
    setIsLoading(true);
      setError(null);
      try {
        // Revert endpoint to /api_keys as per user feedback
        const response = await ApiService.get('/api_keys');
         // Correctly parse the list from response.data
        const keys = response?.data || [];
        setApiKeys(keys);
      } catch (err) {
      console.error("Error fetching API keys:", err);
      setError(err.message || 'Failed to fetch API keys.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = (keyToCopy) => {
    navigator.clipboard.writeText(keyToCopy);
    setCopiedKey(keyToCopy);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleIPToggle = (ip) => {
    setSelectedIPs(prev => 
      prev.includes(ip) 
        ? prev.filter(i => i !== ip)
        : [...prev, ip]
    );
  };

  // --- Create Key Modal Handlers ---
  const handleOpenCreateModal = () => {
    setNewKeyName('');
    setCreateError(null);
    setNewlyCreatedKey(null); // Clear any previously shown key
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateKey = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!newKeyName.trim()) {
      setCreateError('Key name is required.');
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    setNewlyCreatedKey(null);

    try {
      // Revert endpoint to /api_keys as per user feedback
      const response = await ApiService.post('/api_keys', { name: newKeyName }); 
      const createdKeyData = response?.data; // Key object is directly in response.data

      if (createdKeyData && createdKeyData.key) { // Check for .key field
         setNewlyCreatedKey(createdKeyData); // Store the full key data to display
         fetchApiKeys(); // Refresh the list
         // Keep modal open to show the key
         // handleCloseCreateModal(); // Optionally close modal immediately
      } else {
         // If key data or the key itself is missing in response
         console.error("Create API Key response missing key data:", response);
         setCreateError('Failed to create key. Unexpected response from server.');
         // Don't necessarily need to refresh list here if creation failed server-side
         // fetchApiKeys(); 
      }

    } catch (err) {
      console.error("Error creating API key:", err);
      // Extract specific validation errors if available
      const message = err?.errors?.name?.[0] || err.message || 'Failed to create API key.';
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };
  // --- End Create Key Modal Handlers ---

  // --- Delete Key Handler ---
  const openDeleteModal = (apiKeyItem) => {
    setKeyToDelete(apiKeyItem);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setKeyToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const confirmDeleteKey = async () => {
    if (!keyToDelete) return;

    setDeletingKeyId(keyToDelete.id);
    setDeleteError(null);
    setError(null);

    try {
      await ApiService.delete(`/api_keys/${keyToDelete.id}`);
      setApiKeys(prevKeys => prevKeys.filter(k => k.id !== keyToDelete.id));
      closeDeleteModal();
    } catch (err) {
      console.error(`Error deleting API key ${keyToDelete.id}:`, err);
      const message = err.message || `Failed to delete API key "${keyToDelete.name}".`;
      setDeleteError(message); // Show error in modal
      // setError(`Error deleting key "${keyToDelete.name}": ${message}`); // Or show globally
    } finally {
      setDeletingKeyId(null);
    }
  };
  // --- End Delete Key Handler ---


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section - Adjusted padding for mobile */}
        <div className="bg-gradient-to-r from-gray-50 to-purple-50 p-4 md:p-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-2"> {/* Adjusted text size */}
              <span className="text-gray-800">ThinkHuge</span>{' '}
              <span className="text-blue-600">API</span>{' '}
              <span className="text-orange-500">Documentation</span>
            </h1>
            <p className="text-gray-600 text-base md:text-lg mb-6"> {/* Adjusted text size */}
              Create integrations, retrieve data, and automate your workflows with the ThinkHuge API.
            </p>
            {/* Adjusted button layout for mobile */}
            <div className="flex flex-col sm:flex-row gap-3"> 
              {/* Hidden as per user request */}
              {/* <button className="px-4 py-2 bg-white rounded-lg border hover:bg-gray-50 text-center">
                iFrame
              </button> */}
              <Link 
                href="/infrastructure/integrations/logs" 
                className="px-4 py-2 bg-white rounded-lg border hover:bg-gray-50 inline-flex items-center justify-center text-center" // Added inline-flex and justify-center
              >
                View Logs
              </Link>
            </div>
          </div>
        </div>

        {/* Main content layout - Adjusted for mobile */}
        <div className="flex flex-col md:flex-row"> 
          {/* Left Menu - Hidden on mobile, shown on md+ */}
          <div className="w-full md:w-64 p-4 md:p-6 hidden md:block"> {/* Added hidden md:block, adjusted padding */}
            <nav className="space-y-1 sticky top-6">
              {menuItems.map((item, index) => (
                <div key={index}>
                  {item.items ? (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-sm font-medium text-gray-900">
                        {item.label}
                      </div>
                      <div className="ml-3">
                        {item.items.map((subItem, subIndex) => (
                          <a
                            key={subIndex}
                            href={subItem.href}
                            className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                          >
                            {subItem.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <a
                      href={item.href}
                      className={`block px-3 py-2 text-sm rounded-md ${
                        currentHash === item.href
                          ? 'bg-gray-200 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </a>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Main Content - Takes full width on mobile */}
          <div className="flex-1 p-2 md:p-4"> {/* Adjusted padding */}
            {/* Welcome Section */}
            <section id="welcome" className="scroll-mt-6">
              <div className="bg-white rounded-xl border p-4 md:p-6 mb-8"> {/* Adjusted padding */}
                <h2 className="text-2xl font-semibold mb-4">Welcome to the ThinkHuge API</h2>
                <div className="prose max-w-none text-gray-600">
                  <p className="mb-4">
                    We've created this API to be as EASY as possible to integrate with your brokerage. 
                    Essentially the API allows you to create and destroy VMs on the fly. You can also use 
                    the API to request information about your users.
                  </p>
                  <p className="mb-4">
                    There is no need for you to store any information about a client or their VM's as our 
                    database will store everything you need. As long as you store the clients email address, 
                    then you can use that to lookup everything you need.
                  </p>
                  <p className="mb-6">
                    The format of calling from the API is done using the following format:
                  </p>
                  {/* Added horizontal scroll for code block */}
                  <pre className="bg-gray-50 p-4 rounded-lg mb-4 font-mono text-sm overflow-x-auto"> 
                    https://broker.forexvps.net/api/version/clientid/call
                  </pre>
                  <p>
                    For authentication, you need to send your API key as header named 'X-Api-Key' along with your request
                  </p>
                </div>
              </div>
            </section>

            {/* API Key Section */}
            <section id="api-key" className="scroll-mt-6">
              <div className="bg-white rounded-xl border p-4 md:p-6 mb-8"> {/* Adjusted padding */}
                {/* Adjusted button layout for mobile */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0"> 
                  <h2 className="text-xl md:text-2xl font-semibold">API Key</h2> {/* Adjusted text size */}
                  {/* Changed button to "Create API Key" */}
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center" /* Adjusted width and centering */
                    onClick={handleOpenCreateModal} // Open the modal
                  >
                    <Plus size={16} />
                    Create API Key
                  </button>
                </div>

                {/* API Key List */}
                <div className="rounded-lg p-4 md:p-6"> {/* Adjusted padding */}
                   <p className="text-gray-600 mb-6 text-sm md:text-base"> {/* Adjusted text size */}
                    Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in
                    publicly accessible areas such as GitHub, client-side code, and so forth. All API access requires a valid key.
                  </p>
                  {isLoading && <p className="text-gray-500">Loading API keys...</p>}
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
                       <AlertCircle size={16} /> {error}
                    </div>
                  )}
                  {!isLoading && !error && apiKeys.length === 0 && (
                    <p className="text-gray-500">No API keys found. Create one to get started.</p>
                  )}
                  {!isLoading && !error && apiKeys.length > 0 && (
                    <div className="space-y-4">
                      {apiKeys.map((apiKeyItem) => ( // Renamed variable for clarity
                        <div key={apiKeyItem.id} className="flex flex-row justify-between items-center gap-2 p-3 border rounded-md bg-white">
                           {/* Display the key name and created_at */}
                           <div className="flex flex-col">
                             <span className="font-medium text-gray-800">{apiKeyItem.name}</span>
                             {apiKeyItem.created_at && (
                               <span className="text-xs text-gray-500">
                                 Created: {new Date(apiKeyItem.created_at).toLocaleDateString()}
                               </span>
                             )}
                           </div>
                           {/* Remove partial key display, copy button */}
                           <button
                            title="Delete Key"
                            className={`p-1.5 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed ${deletingKeyId === apiKeyItem.id ? 'animate-pulse' : ''}`}
                            onClick={() => openDeleteModal(apiKeyItem)} // Open delete confirmation modal
                            disabled={deletingKeyId === apiKeyItem.id} 
                          >
                            {deletingKeyId === apiKeyItem.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* IP Lockdown Section */}
            {/* <section id="ip-lockdown" className="scroll-mt-6">
              <div className="bg-white rounded-xl border p-4 md:p-6 mb-8"> 
                <h2 className="text-xl md:text-2xl font-semibold mb-6">IP Lockdown</h2>
                <div className="mb-4">
                  <p className="text-gray-600 mb-2 text-sm md:text-base">
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
            </section> */}

            {/* API Reference Section Removed */}

            {/* API Docs Section */}
            <section id="api-docs" className="scroll-mt-6">
              <div className="bg-white rounded-xl border p-4 md:p-6 mb-8"> {/* Adjusted padding */}
                <h2 className="text-xl md:text-2xl font-semibold mb-4">API Documentation</h2> {/* Adjusted text size */}
                <div className="mt-4 text-center"> {/* Added text-center to center the button */}
                  <p className="text-gray-600 mb-6 text-sm md:text-base">
                    Our comprehensive API documentation provides all the details you need to integrate with our services. Click the button below to explore the available endpoints, request/response formats, and authentication methods.
                  </p>
                  <Link
                    href={process.env.NEXT_PUBLIC_API_PUBLIC_DOCS || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <ExternalLink size={20} className="mr-2" />
                    View API Documentation
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Create API Key Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={handleCloseCreateModal} 
        title="Create New API Key"
        size="lg" /* Changed from 'md' to 'lg' to make the modal wider */
      >
        {newlyCreatedKey ? (
          // Display the newly created key
          <div>
            <p className="text-green-600 mb-3 font-medium">API Key created successfully!</p>
            <p className="mb-4 text-sm text-gray-600">Make sure to copy your new API key now. You won't be able to see it again!</p>
            <div className="p-4 rounded-md mb-4">
              {/* Improved layout with consistent grid for name and key */}
              <div className="grid grid-cols-[120px_1fr] gap-y-3">
                <span className="font-semibold text-gray-700">Name:</span>
                <span>{newlyCreatedKey.name}</span>
                
                <span className="font-semibold text-gray-700">Key:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono break-all">{newlyCreatedKey.key}</span> 
                  <button
                    title="Copy Key"
                    className="ml-2 p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-200"
                    onClick={() => handleCopyKey(newlyCreatedKey.key)}
                  >
                    {copiedKey === newlyCreatedKey.key ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleCloseCreateModal}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        ) : (
          // Display the form to create a key
          <form onSubmit={handleCreateKey}>
            <div className="mb-4">
              <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-1">
                Key Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., My Integration Key"
                required
                disabled={isCreating}
              />
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {createError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Creating...
                  </>
                ) : (
                  'Create Key'
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete API Key Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirm Delete API Key"
        size="lg" /* Changed from 'sm' to 'lg' to match the create modal width */
      >
        {keyToDelete && (
          <div>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete the API key named: <strong className="font-medium">{keyToDelete.name}</strong>? 
              This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={deletingKeyId === keyToDelete.id}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteKey}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                disabled={deletingKeyId === keyToDelete.id}
              >
                {deletingKeyId === keyToDelete.id ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  'Delete Key'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
