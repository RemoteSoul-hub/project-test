'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  getCookie, 
  getStorageWithCookieFallback,
  setStorageWithCookieFallback,
  removeStorageWithCookieFallback 
} from '@/utils/cookieUtils';

export default function TokenDebugPage() {
  const { data: session, status } = useSession();
  const { token: authToken } = useAuth();
  const [allCookies, setAllCookies] = useState('');
  const [localStorageItems, setLocalStorageItems] = useState({});
  
  // Helper to safely get localStorage items
  const safeGetLocalStorage = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return `Error: ${e.message}`;
    }
  };
  
  // Helper to safely set localStorage items
  const safeSetLocalStorage = (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  useEffect(() => {
    // Get all cookies
    setAllCookies(document.cookie);
    
    // Get various localStorage items
    const items = {
      'auth_token': safeGetLocalStorage('auth_token'),
      'adminToken': safeGetLocalStorage('adminToken'),
      'laravel_token': safeGetLocalStorage('laravel_token'),
      'user': safeGetLocalStorage('user'),
      'partner_id': safeGetLocalStorage('partner_id'),
    };
    
    setLocalStorageItems(items);
  }, []);
  
  const handleTestTokenStorage = () => {
    const testValue = `test-token-${Date.now()}`;
    
    // Test localStorage
    const localStorageSuccess = safeSetLocalStorage('test_token', testValue);
    
    // Test cookie storage
    setStorageWithCookieFallback('test_cookie_token', testValue);
    
    // Update state after storage attempts
    setTimeout(() => {
      setAllCookies(document.cookie);
      setLocalStorageItems(prev => ({
        ...prev,
        'test_token': safeGetLocalStorage('test_token')
      }));
      
      // Show alert with results
      alert(`
Storage Test Results:
------------------
localStorage: ${localStorageSuccess ? 'SUCCESS' : 'FAILED'}
Cookie: Check the updated cookie list below
      `);
    }, 100);
  };
  
  const handleClearTestData = () => {
    try {
      localStorage.removeItem('test_token');
    } catch (e) {}
    
    removeStorageWithCookieFallback('test_cookie_token');
    
    // Update display
    setTimeout(() => {
      setAllCookies(document.cookie);
      setLocalStorageItems(prev => {
        const newState = {...prev};
        delete newState.test_token;
        return newState;
      });
    }, 100);
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Token Storage Debug Page</h1>
      
      <div className="bg-gray-100 p-4 mb-6 rounded-lg">
        <h2 className="font-bold text-lg mb-2">Session Status</h2>
        <p>Status: <span className="font-mono">{status}</span></p>
        {session && (
          <div className="mt-2">
            <p>User: <span className="font-mono">{session.user?.name || 'Not available'}</span></p>
            <p>Laravel Token: <span className="font-mono">{session.laravelApiToken ? '✅ Available' : '❌ Not available'}</span></p>
          </div>
        )}
      </div>
      
      <div className="bg-gray-100 p-4 mb-6 rounded-lg">
        <h2 className="font-bold text-lg mb-2">Auth Context Token</h2>
        <p>Token Available: <span className="font-mono">{authToken ? '✅ Yes' : '❌ No'}</span></p>
      </div>
      
      <div className="bg-gray-100 p-4 mb-6 rounded-lg">
        <h2 className="font-bold text-lg mb-2">Storage Test</h2>
        <div className="flex gap-3">
          <button 
            onClick={handleTestTokenStorage}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Token Storage
          </button>
          
          <button 
            onClick={handleClearTestData}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Clear Test Data
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-bold text-lg mb-2">LocalStorage Items</h2>
          <pre className="whitespace-pre-wrap bg-white p-3 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(localStorageItems, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-bold text-lg mb-2">All Cookies</h2>
          <pre className="whitespace-pre-wrap bg-white p-3 rounded text-xs overflow-auto max-h-60">
            {allCookies.split(';').map(cookie => cookie.trim()).join('\n')}
          </pre>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>
          This page helps debug token storage issues, especially in reverse proxy environments where 
          cross-origin restrictions might prevent localStorage from working properly.
        </p>
      </div>
    </div>
  );
}
