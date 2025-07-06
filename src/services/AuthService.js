import { signOut as nextAuthSignOut } from 'next-auth/react'; // Added import

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Helper function to set cookies that work across domains
 * @param {string} name Cookie name
 * @param {string} value Cookie value
 * @param {number} days Expiration in days
 */
function setCrossDomainCookie(name, value, days = 30) {
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + (days * 24 * 60 * 60 * 1000));
  
  // Set as a secure cookie with SameSite=None to work across domains
  // Note: SameSite=None requires Secure to be set
  const cookie = `${name}=${encodeURIComponent(value)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=None; Secure`;
  
  if (typeof document !== 'undefined') {
    document.cookie = cookie;
  }
}

/**
 * Helper function to get a cookie value
 * @param {string} name Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }
  
  return null;
}

export async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username: username, // Using email field for username
        password,
      }),
    });

    // Check if the response has a content-type header and if it includes application/json
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        try {
          const errorData = await response.json();
          throw {
            status: 'error',
            message: errorData.message || 'Login failed',
            errors: errorData.errors,
          };
        } catch (jsonError) {
          // If parsing JSON fails, throw a generic error
          throw {
            status: 'error',
            message: 'Login failed with invalid response format',
            errors: {
              general: ['Server returned an invalid response']
            }
          };
        }
      } else {
        // Non-JSON error response
        const textResponse = await response.text();
        throw {
          status: 'error',
          message: textResponse || 'Login failed',
          errors: {
            general: ['Server returned a non-JSON response']
          }
        };
      }
    }

    // For successful responses, also check if it's JSON before parsing
    let data;
    if (isJson) {
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw {
          status: 'error',
          message: 'Invalid JSON response from server',
          errors: {
            general: ['Server returned an invalid JSON response']
          }
        };
      }
    } else {
      // Handle non-JSON successful responses
      const textResponse = await response.text();
      throw {
        status: 'error',
        message: 'Unexpected response format from server',
        errors: {
          general: ['Expected JSON response but received text']
        }
      };
    }

    // Save auth data - try localStorage first, fallback to cookies
    try {
      setAuthToken(data.token);
      setUser(data.user);
    } catch (e) {
      console.warn('Error setting tokens in localStorage, using cookies instead:', e);
      // Set cross-domain cookies as fallback
      setCrossDomainCookie('auth_token', data.token);
      setCrossDomainCookie('user', JSON.stringify(data.user));
    }

    // Return success response in expected format
    return {
      status: 'success',
      data: {
        token: data.token,
        user: data.user,
      },
    };
  } catch (error) {
    if (error.status === 'error') {
      throw error;
    }
    throw {
      status: 'error',
      message: 'Network error occurred',
      errors: {
        general: ['Failed to connect to server'],
      },
    };
  }
}

export async function signup(fullName, email, password) {
  try {
    const response = await fetch(`${API_URL}/register`, { // Assuming /register endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: fullName, // Assuming API expects 'name'
        email: email,
        password: password,
      }),
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        try {
          const errorData = await response.json();
          throw {
            status: 'error',
            message: errorData.message || 'Signup failed',
            errors: errorData.errors,
          };
        } catch (jsonError) {
          throw {
            status: 'error',
            message: 'Signup failed with invalid response format',
            errors: { general: ['Server returned an invalid response'] },
          };
        }
      } else {
        const textResponse = await response.text();
        throw {
          status: 'error',
          message: textResponse || 'Signup failed',
          errors: { general: ['Server returned a non-JSON response'] },
        };
      }
    }

    let data;
    if (isJson) {
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw {
          status: 'error',
          message: 'Invalid JSON response from server',
          errors: { general: ['Server returned an invalid JSON response'] },
        };
      }
    } else {
      const textResponse = await response.text();
      throw {
        status: 'error',
        message: 'Unexpected response format from server',
        errors: { general: ['Expected JSON response but received text'] },
      };
    }

    // Assuming signup also returns token and user like login
    // If not, adjust accordingly based on actual API response
    if (data.token && data.user) {
       // Optionally auto-login the user by setting token/user here
       // setAuthToken(data.token);
       // setUser(data.user);
       return {
         status: 'success',
         data: {
           token: data.token,
           user: data.user,
         },
       };
    } else {
        // Handle cases where signup might just return success message
        return {
            status: 'success',
            message: data.message || 'Account created successfully. Please log in.',
            data: {} // Or return the actual data structure
        };
    }

  } catch (error) {
    if (error.status === 'error') {
      throw error;
    }
    console.error('Signup network error:', error);
    throw {
      status: 'error',
      message: 'Network error occurred during signup',
      errors: { general: ['Failed to connect to server'] },
    };
  }
}


export async function logout() { // Made function async
  // Sign out from NextAuth (handles Google session etc.)
  // We use an alias for signOut to avoid conflict if this module ever exports its own 'signOut'
  if (typeof window !== 'undefined') { // nextAuthSignOut should run client-side
    try {
      await nextAuthSignOut({ redirect: false });
    } catch (error) {
      console.error("Error during NextAuth signOut:", error);
      // Decide if you want to proceed with local cleanup even if NextAuth signOut fails
    }
  }

  // Clear all app-specific auth data, including impersonation
  stopImpersonation(false); // Stop impersonation without redirecting yet
  
  try {
    localStorage.removeItem('auth_token'); // Clear original Laravel auth token
    localStorage.removeItem('user'); // Clear original user data
    localStorage.removeItem('partner_id'); // Clear partner_id if it exists
  } catch (e) {
    console.warn('Error clearing localStorage:', e);
  }

  // Clear auth token cookies (Laravel token) - both traditional and cross-domain
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
    document.cookie = 'partner_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
  }

  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function setAuthToken(token) {
  try {
    localStorage.setItem('auth_token', token);
  } catch (e) {
    console.warn('Error setting auth token in localStorage:', e);
    // Set as cross-domain cookie instead
    setCrossDomainCookie('auth_token', token);
  }
  
  // Always set as cookie for good measure
  if (typeof document !== 'undefined') {
    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }
}

export function getAuthToken() {
  // Prioritize impersonation token if available
  let token = null;
  
  try {
    token = localStorage.getItem('impersonation_token');
    if (token) return token;
    
    // Fallback to the standard auth token
    token = localStorage.getItem('auth_token');
  } catch (e) {
    console.warn('Error accessing localStorage:', e);
  }
  
  // If not in localStorage or access failed, try cookies
  if (!token) {
    token = getCookie('impersonation_token') || getCookie('auth_token');
  }
  
  return token;
}

export function getAdminAuthToken() {
  // Get the original admin token stored during impersonation
  let token = null;
  
  try {
    token = localStorage.getItem('admin_token');
  } catch (e) {
    console.warn('Error accessing localStorage:', e);
  }
  
  // If not in localStorage or access failed, try cookies
  if (!token) {
    token = getCookie('admin_token');
  }
  
  return token;
}

export function setUser(user) {
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (e) {
    console.warn('Error setting user in localStorage:', e);
    // Set as cross-domain cookie instead
    setCrossDomainCookie('user', JSON.stringify(user));
  }
}

export function getUser() {
  let user = null;
  
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (e) {
    console.warn('Error accessing user from localStorage:', e);
  }
  
  // If not in localStorage or access failed, try cookies
  const cookieUser = getCookie('user');
  if (cookieUser) {
    try {
      user = JSON.parse(cookieUser);
    } catch (e) {
      console.warn('Error parsing user from cookie:', e);
    }
  }
  
  return user;
}

export function getImpersonatedUser() {
  let user = null;
  
  try {
    const userStr = localStorage.getItem('impersonated_user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (e) {
    console.warn('Error accessing impersonated user from localStorage:', e);
  }
  
  // If not in localStorage or access failed, try cookies
  const cookieUser = getCookie('impersonated_user');
  if (cookieUser) {
    try {
      user = JSON.parse(cookieUser);
    } catch (e) {
      console.warn('Error parsing impersonated user from cookie:', e);
    }
  }
  
  return user;
}

export function isImpersonating() {
  let isImpersonating = false;
  
  try {
    isImpersonating = !!localStorage.getItem('impersonation_token');
  } catch (e) {
    console.warn('Error accessing localStorage for impersonation check:', e);
  }
  
  // If not found in localStorage or access failed, check cookies
  if (!isImpersonating) {
    isImpersonating = !!getCookie('impersonation_token');
  }
  
  return isImpersonating;
}

// Modified to accept the admin's token directly and set cookie
export function startImpersonation(adminToken, impersonationToken, impersonatedUser) {
  if (adminToken && !isImpersonating()) { // Ensure we have the admin token and are not already impersonating
    try {
      localStorage.setItem('admin_token', adminToken); // Store the provided admin token
      localStorage.setItem('impersonation_token', impersonationToken); // Set the new impersonation token
      localStorage.setItem('impersonated_user', JSON.stringify(impersonatedUser)); // Store impersonated user details
    } catch (e) {
      console.warn('Error setting impersonation data in localStorage:', e);
      // Set as cross-domain cookies instead
      setCrossDomainCookie('admin_token', adminToken);
      setCrossDomainCookie('impersonation_token', impersonationToken);
      setCrossDomainCookie('impersonated_user', JSON.stringify(impersonatedUser));
    }

    // Set the auth_token cookie for middleware check on non-admin routes - both traditional and cross-domain
    if (typeof document !== 'undefined') {
      // Set cookie to expire in, e.g., 1 day. Adjust as needed.
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);
      document.cookie = `auth_token=${impersonationToken}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
      // Also set cross-domain cookie
      setCrossDomainCookie('auth_token', impersonationToken, 1);
    }

    return true; // Explicitly return true on success path
  } else {
    // Log the reason for failure in detail
    const alreadyImpersonating = isImpersonating();
    console.error(
      `Cannot start impersonation. Reason: ${!adminToken ? 'Admin token was not provided.' : ''}${alreadyImpersonating ? ' Already impersonating (impersonation_token exists).' : ''}`,
      { adminTokenProvided: !!adminToken, isCurrentlyImpersonating: alreadyImpersonating }
    );
    return false; // Return false on failure path
  }
}

export function stopImpersonation(redirect = true) {
  try {
    const wasImpersonating = isImpersonating();
    
    // Clear all impersonation-related data from both localStorage and cookies
    try {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('impersonation_token');
      localStorage.removeItem('impersonated_user');
    } catch (e) {
      console.warn('Error clearing impersonation data from localStorage:', e);
    }
    
    if (typeof document !== 'undefined') {
      // Clear both traditional and cross-domain cookies
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'impersonation_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'impersonated_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      document.cookie = 'impersonation_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      document.cookie = 'impersonated_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
    }

    if (wasImpersonating && redirect) {
      // Redirect back to admin users page after stopping impersonation
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/users';
      }
    }
    
    return wasImpersonating;
  } catch (error) {
    console.error('Error during stopImpersonation:', error);
    return false;
  }
}
