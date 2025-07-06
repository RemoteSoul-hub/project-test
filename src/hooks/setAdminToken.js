'use client';

import { useState, useEffect } from 'react';
import { getAuthToken, setAuthToken } from '@/services/AuthService';

export function useAdminToken() {
  const [token, setToken] = useState('');

  useEffect(() => {
    // Initialize from AuthService when component mounts
    if (typeof window !== 'undefined') {
      const storedToken = getAuthToken();
      if (storedToken) {
        setToken(storedToken);
      }
    }
  }, []);

  // Function to update both state and AuthService
  const updateToken = (newToken) => {
    if (typeof window !== 'undefined') {
      setAuthToken(newToken);
      setToken(newToken);
    }
  };

  return [token, updateToken];
}
