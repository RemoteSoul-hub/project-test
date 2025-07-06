/**
 * Utility functions for handling cookies across domains in a reverse proxy environment
 */

/**
 * Sets a cookie that works across domains (SameSite=None, Secure)
 * To be used when the app is behind a reverse proxy
 * 
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration in days
 * @returns {string|void} - The cookie string (for server-side use) or void (for client-side use)
 */
export function setCrossDomainCookie(name, value, days = 30) {
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + (days * 24 * 60 * 60 * 1000));
  
  // Build the cookie string
  const cookieValue = `${name}=${encodeURIComponent(value)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=None; Secure`;
  
  // If in browser environment, set the cookie directly
  if (typeof document !== 'undefined') {
    try {
      document.cookie = cookieValue;
    } catch (err) {
      console.error(`Failed to set cookie ${name}:`, err);
    }
    
    // For debugging
    const success = document.cookie.includes(name);
    console.log(`Cookie ${name} set successfully: ${success}`);
  }
  
  // Return the cookie string (useful for server-side scenarios like Next.js API routes)
  return cookieValue;
}

/**
 * Sets a standard cookie (SameSite=Lax)
 * 
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration in days
 * @returns {void}
 */
export function setStandardCookie(name, value, days = 30) {
  if (typeof document === 'undefined') return;
  
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Gets a cookie value
 * 
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }
  
  return null;
}

/**
 * Removes a cookie by setting its expiration date to the past
 * Removes both standard and cross-domain cookie variants
 * 
 * @param {string} name - Cookie name
 * @returns {void}
 */
export function removeCookie(name) {
  if (typeof document === 'undefined') return;
  
  // Remove standard cookie
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  // Remove cross-domain cookie
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`;
}

/**
 * Sets a value in both localStorage and as a cookie
 * Falls back to just cookies if localStorage access fails
 * 
 * @param {string} key - Storage key
 * @param {string|object} value - Value to store (objects will be JSON stringified)
 * @returns {void}
 */
export function setStorageWithCookieFallback(key, value) {
  if (value === undefined || value === null) {
    console.warn(`Attempting to store ${key} with null/undefined value`);
    return;
  }
  
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  // Only attempt localStorage in browser environment
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, stringValue);
      console.log(`Successfully stored ${key} in localStorage`);
    } catch (e) {
      console.warn(`Error setting ${key} in localStorage:`, e);
      // If it's a QuotaExceededError, we might want to clear some space
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, will rely on cookies only');
      }
    }
  }
  
  // Always set cookies as a fallback (both types for maximum compatibility)
  setCrossDomainCookie(key, stringValue);
  setStandardCookie(key, stringValue);
  
  // Verify cookies were set
  setTimeout(() => {
    const cookieValue = getCookie(key);
    if (!cookieValue) {
      console.warn(`Failed to set ${key} as cookie. This may be due to browser cookie restrictions.`);
    } else {
      console.log(`Successfully stored ${key} as cookie`);
    }
  }, 10);
}

/**
 * Gets a value from localStorage or cookies
 * 
 * @param {string} key - Storage key
 * @param {boolean} isJson - Whether the value should be parsed as JSON
 * @returns {string|object|null} The stored value or null if not found
 */
export function getStorageWithCookieFallback(key, isJson = false) {
  let value = null;
  let storageSource = '';
  
  // Try localStorage first, but only in browser environment
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      value = localStorage.getItem(key);
      if (value) storageSource = 'localStorage';
    } catch (e) {
      console.warn(`Error accessing ${key} from localStorage:`, e);
    }
  }
  
  // If not found in localStorage, try cookies
  if (!value) {
    value = getCookie(key);
    if (value) storageSource = 'cookie';
  }
  
  // For debugging
  if (value) console.log(`Retrieved ${key} from ${storageSource}`);
  
  // Parse JSON if needed and possible
  if (value && isJson) {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn(`Error parsing JSON for ${key}:`, e);
      return null;
    }
  }
  
  return value;
}

/**
 * Removes a value from both localStorage and cookies
 * 
 * @param {string} key - Storage key
 * @returns {void}
 */
export function removeStorageWithCookieFallback(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Error removing ${key} from localStorage:`, e);
  }
  
  removeCookie(key);
}

/**
 * Sets storage values specifically for authentication in a reverse proxy environment
 * This function takes extra steps to ensure tokens are properly stored
 * 
 * @param {string} token - The authentication token to store
 * @returns {boolean} - Whether the operation was successful
 */
export function setAuthStorageForReverseProxy(token) {
  if (!token) {
    console.warn("Attempted to store empty authentication token");
    return false;
  }
  
  let localStorageSuccess = false;
  
  // Try all available storage methods
  // 1. localStorage with different key variations
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Store with multiple keys for redundancy
      localStorage.setItem('adminToken', token);
      localStorage.setItem('laravel_token', token);
      localStorage.setItem('auth_token', token);
      localStorageSuccess = true;
      console.log("Successfully stored auth token in localStorage");
    } catch (e) {
      console.warn("Failed to store auth token in localStorage:", e);
    }
  }
  
  // 2. Set cookies with multiple approaches
  // Standard cookies
  setStandardCookie('adminToken', token);
  setStandardCookie('laravel_token', token);
  setStandardCookie('auth_token', token);
  
  // Cross-domain cookies
  setCrossDomainCookie('adminToken', token);
  setCrossDomainCookie('laravel_token', token);
  setCrossDomainCookie('auth_token', token);
  
  // 3. Try sessionStorage as a last resort
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem('adminToken', token);
      sessionStorage.setItem('laravel_token', token);
      console.log("Backup: stored auth token in sessionStorage");
    } catch (e) {
      console.warn("Failed to store auth token in sessionStorage:", e);
    }
  }
  
  // Verify cookie storage worked
  setTimeout(() => {
    const cookieCheck = getCookie('laravel_token') || getCookie('adminToken') || getCookie('auth_token');
    if (!cookieCheck) {
      console.error("Failed to store authentication token in cookies. Authentication may not persist.");
      return false;
    } else {
      console.log("Verified auth token cookie storage successful");
    }
  }, 50);
  
  return true;
}

/**
 * Retrieves an authentication token using all available storage mechanisms
 * Designed to be resilient in reverse proxy environments
 * 
 * @returns {string|null} - The stored authentication token or null if not found
 */
export function getAuthTokenFromAllStorages() {
  let token = null;
  
  // Check localStorage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      token = localStorage.getItem('adminToken') || 
              localStorage.getItem('laravel_token') || 
              localStorage.getItem('auth_token');
      
      if (token) {
        return token;
      }
    } catch (e) {
      // Silently continue to next storage method
    }
  }
  
  // Check cookies
  token = getCookie('laravel_token') || getCookie('adminToken') || getCookie('auth_token');
  if (token) {
    return token;
  }
  
  // Try sessionStorage as a last resort
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('laravel_token');
      if (token) {
        return token;
      }
    } catch (e) {
      // Silently continue
    }
  }
  
  return null;
}
