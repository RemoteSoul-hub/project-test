import { logout } from "./AuthService";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Utility function to get token from cookies when needed
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }
  
  return null;
}

// Get token from all possible storage mechanisms
function getToken() {
  // Try finding token in various storages
  let token = null;
  
  // Check NextAuth session storage (client-side only)
  if (typeof window !== 'undefined' && window.__NEXT_DATA__?.props?.pageProps?.__session?.laravelApiToken) {
    token = window.__NEXT_DATA__.props.pageProps.__session.laravelApiToken;
    return token;
  }
  
  // Try localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      token = localStorage.getItem('adminToken') || 
              localStorage.getItem('laravel_token') || 
              localStorage.getItem('auth_token');
      if (token) return token;
    } catch (e) { /* ignore storage errors */ }
  }
  
  // Try cookies
  token = getCookie('adminToken') || getCookie('laravel_token') || getCookie('auth_token');
  if (token) return token;
  
  // Try sessionStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('laravel_token');
      if (token) return token;
    } catch (e) { /* ignore storage errors */ }
  }
  
  return null;
}

class AdminApiService {
  // New method to get token if not provided
  static getAuthToken(providedToken) {
    return providedToken || getToken();
  }

  static async getUsers(token, params = {}) {
    try {
      // Use the provided token or get it from storage
      token = this.getAuthToken(token);
      
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const url = new URL(`${API_URL}/users`);
      
      // Always include partner filter by default
      //url.searchParams.append('filter[role]', 'partner');
      
      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit) {
          url.searchParams.append('limit', params.limit);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
        if (params.per_page) {
          url.searchParams.append('per_page', params.per_page);
        }
        if (params['filter[role]']) {
          url.searchParams.append('filter[role]', params['filter[role]']);
        }
      }
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  static async downloadFile(token, endpoint, params = {}, mimeType = 'application/octet-stream') {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}${endpoint}`);
      
      // Append parameters (e.g., format)
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": mimeType
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout(); // Assuming logout handles redirect or state update
          throw new Error("Unauthorized. You have been logged out.");
        }
        // Attempt to get more error details if possible
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch (e) { /* ignore */ }
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}. ${errorBody}`);
      }

      // Return the file data as a Blob
      const blob = await response.blob();
      return blob;

    } catch (error) {
      console.error("Error downloading file:", error);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  static async createUser(token, userData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/users`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        // Attempt to get more error details
        let errorBody = '';
        try {
          // Try parsing as JSON first
          errorBody = await response.json(); 
        } catch (e) { 
          try {
             // Fallback to text if JSON parsing fails
            errorBody = await response.text();
          } catch (e2) { /* ignore if text also fails */ }
        }
        console.error("Server error response:", errorBody);
        // Include stringified error body for better debugging
        throw new Error(`Failed to create user: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      // Assuming the API returns the created user data upon success
      const data = await response.json(); 
      return data; 
    } catch (error) {
      console.error("Error creating user:", error);
      // Re-throw the error so the calling component can handle it (e.g., show a notification)
      throw error; 
    }
  }

  static async getUser(token, userId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/users/${userId}`);

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  static async updateUser(token, userId, userData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/users/${userId}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to update user: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  static async updatePartnerUser(token, partnerId, userId, userData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/partners/${partnerId}/users/${userId}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to update partner user: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating partner user:", error);
      throw error;
    }
  }

  static async getInvoices(token, params = {}) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/invoices`);
      
      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit || params.per_page) {
          url.searchParams.append('per_page', params.limit || params.per_page);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
  }

  static async createInvoice(token, invoiceData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/invoices`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        // Attempt to get more error details
        let errorBody = '';
        try {
          // Try parsing as JSON first
          errorBody = await response.json();
        } catch (e) {
          try {
            // Fallback to text if JSON parsing fails
            errorBody = await response.text();
          } catch (e2) { /* ignore if text also fails */ }
        }
        console.error("Server error response:", errorBody);
        // Include stringified error body for better debugging
        throw new Error(`Failed to create invoice: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      // Assuming the API returns the created invoice data upon success
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating invoice:", error);
      // Re-throw the error so the calling component can handle it (e.g., show a notification)
      throw error;
    }
  }

  static async getInvoice(token, invoiceId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/invoices/${invoiceId}`);

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch invoice: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching invoice:", error);
      throw error;
    }
  }

  static async updateInvoice(token, invoiceId, invoiceData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/invoices/${invoiceId}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to update invoice: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
  }

  static async createInvoiceItem(token, itemData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/invoice_items`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to create invoice item: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating invoice item:", error);
      throw error;
    }
  }

  static async getInvoiceItem(token, invoiceItemId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/invoice_items/${invoiceItemId}`);

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch invoice item: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching invoice item:", error);
      throw error;
    }
  }

  static async updateInvoiceItem(token, invoiceItemId, itemData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/invoice_items/${invoiceItemId}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to update invoice item: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating invoice item:", error);
      throw error;
    }
  }

  static async deleteInvoiceItem(token, invoiceItemId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/invoice_items/${invoiceItemId}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to delete invoice item: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      throw error;
    }
  }

  static async getInvoiceItemsForInvoice(token, invoiceId, params = {}) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/invoices/${invoiceId}/invoice_items`);
      
      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit || params.per_page) {
          url.searchParams.append('per_page', params.limit || params.per_page);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch invoice items for invoice: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching invoice items for invoice:", error);
      throw error;
    }
  }

  static async impersonateUser(token, userId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/impersonate`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ user_id: userId }),
      });

      

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to impersonate user: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error impersonating user:", error);
      throw error;
    }
  }

  static async impersonate(token, userId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/impersonate`); // Target the specified endpoint

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ user_id: userId }), // Send user_id in the body
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to impersonate user: ${response.status}`);
      }

      return response.json(); // Return the response JSON directly
    } catch (error) {
      console.error("Error impersonating user:", error);
      // Log the specific error caught during fetch or JSON parsing
      throw error;
    }
  }

  static async getPartner(token, partnerId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const url = new URL(`${API_URL}/partners/${partnerId}`);
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch partner: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching partner:", error);
      throw error;
    }
  }

  static async getPartners(token, params = {}) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const url = new URL(`${API_URL}/partners`);
      
      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit) {
          url.searchParams.append('limit', params.limit);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch partners: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching partners:", error);
      throw error;
    }
  }

  static async createPartner(token, partnerData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/partners`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(partnerData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to create partner: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating partner:", error);
      throw error;
    }
  }

  static async updatePartner(token, partnerId, partnerData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/partners/${partnerId}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(partnerData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to update partner: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating partner:", error);
      throw error;
    }
  }

  static async getLocations(token, params = {}) {
    try {
      
      
      
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/locations`);
      

      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit) {
          url.searchParams.append('limit', params.limit);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });
      

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch locations: ${response.status}`);
      }

      // Return the raw response data without additional wrapping
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching locations:", error);
      throw error;
    }
  }

  static async getLocation(token, locationId) {
    if (!token) throw new Error("No authentication token provided");
    const response = await fetch(`${API_URL}/locations/${locationId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Unauthorized. You have been logged out.");
      }
      throw new Error(`Failed to fetch location: ${response.status}`);
    }
    return await response.json();
  }

  static async createLocation(token, locationData) {
    if (!token) throw new Error("No authentication token provided");
    const response = await fetch(`${API_URL}/locations`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(locationData),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Unauthorized. You have been logged out.");
      }
      let errorBody = '';
      try { errorBody = await response.json(); } catch (e) { try { errorBody = await response.text(); } catch (e2) {} }
      throw new Error(`Failed to create location: ${response.status} ${JSON.stringify(errorBody)}`);
    }
    return await response.json();
  }

  static async updateLocation(token, locationId, locationData) {
    if (!token) throw new Error("No authentication token provided");
    const response = await fetch(`${API_URL}/locations/${locationId}`, {
      method: 'PUT',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(locationData),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Unauthorized. You have been logged out.");
      }
      let errorBody = '';
      try { errorBody = await response.json(); } catch (e) { try { errorBody = await response.text(); } catch (e2) {} }
      throw new Error(`Failed to update location: ${response.status} ${JSON.stringify(errorBody)}`);
    }
    return await response.json();
  }

  static async deleteLocation(token, locationId) {
    if (!token) throw new Error("No authentication token provided");
    const response = await fetch(`${API_URL}/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Unauthorized. You have been logged out.");
      }
      let errorBody = '';
      try { errorBody = await response.json(); } catch (e) { try { errorBody = await response.text(); } catch (e2) {} }
      throw new Error(`Failed to delete location: ${response.status} ${JSON.stringify(errorBody)}`);
    }
    return true;
  }

  static async getPlans(token, params = {}) {
    try {
      
      
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/plans`);
      

      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit) {
          url.searchParams.append('limit', params.limit);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });
      

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch plans: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching plans:", error);
      throw error;
    }
  }

  static async getPlan(token, planId) {
    if (!token) throw new Error("No authentication token provided");
    const response = await fetch(`${API_URL}/plans/${planId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Unauthorized. You have been logged out.");
      }
      throw new Error(`Failed to fetch plan: ${response.status}`);
    }
    return await response.json();
  }

  static async createPlan(token, planData) {
    if (!token) throw new Error("No authentication token provided");
    const response = await fetch(`${API_URL}/plans`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(planData),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Unauthorized. You have been logged out.");
      }
      let errorBody = '';
      try { errorBody = await response.json(); } catch (e) { try { errorBody = await response.text(); } catch (e2) {} }
      throw new Error(`Failed to create plan: ${response.status} ${JSON.stringify(errorBody)}`);
    }
    return await response.json();
  }

  static async updatePlan(token, planId, planData) {
    if (!token) throw new Error("No authentication token provided");
    const response = await fetch(`${API_URL}/plans/${planId}`, {
      method: 'PUT',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(planData),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Unauthorized. You have been logged out.");
      }
      let errorBody = '';
      try { errorBody = await response.json(); } catch (e) { try { errorBody = await response.text(); } catch (e2) {} }
      throw new Error(`Failed to update plan: ${response.status} ${JSON.stringify(errorBody)}`);
    }
    return await response.json();
  }

  static async deletePlan(token, planId) {
    if (!token) throw new Error("No authentication token provided");
    const response = await fetch(`${API_URL}/plans/${planId}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Unauthorized. You have been logged out.");
      }
      let errorBody = '';
      try { errorBody = await response.json(); } catch (e) { try { errorBody = await response.text(); } catch (e2) {} }
      throw new Error(`Failed to delete plan: ${response.status} ${JSON.stringify(errorBody)}`);
    }
    return true;
  }

  static async getOsTemplateGroups(token, params = {}) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const url = new URL(`${API_URL}/os_template_groups`);
      
      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit) {
          url.searchParams.append('limit', params.limit);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch OS template groups: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching OS template groups:", error);
      throw error;
    }
  }
  
  static async getOsTemplateGroup(token, groupId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const response = await fetch(`${API_URL}/os_template_groups/${groupId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch OS template group: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching OS template group:", error);
      throw error;
    }
  }
  
  static async createOsTemplateGroup(token, groupData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/os_template_groups`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to create OS template group: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating OS template group:", error);
      throw error;
    }
  }
  
  static async updateOsTemplateGroup(token, groupId, groupData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/os_template_groups/${groupId}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to update OS template group: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating OS template group:", error);
      throw error;
    }
  }
  
  static async deleteOsTemplateGroup(token, groupId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/os_template_groups/${groupId}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to delete OS template group: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting OS template group:", error);
      throw error;
    }
  }

  static async getOsTemplates(token, params = {}) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const url = new URL(`${API_URL}/os_templates`);
      
      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit) {
          url.searchParams.append('limit', params.limit);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch OS templates: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching OS templates:", error);
      throw error;
    }
  }

  static async getOsTemplate(token, osTemplateId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const response = await fetch(`${API_URL}/os_templates/${osTemplateId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch OS template: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching OS template:", error);
      throw error;
    }
  }

  static async createOsTemplate(token, osTemplateData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/os_templates`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(osTemplateData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to create OS template: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating OS template:", error);
      throw error;
    }
  }

  static async updateOsTemplate(token, osTemplateId, osTemplateData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/os_templates/${osTemplateId}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(osTemplateData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to update OS template: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating OS template:", error);
      throw error;
    }
  }

  static async deleteOsTemplate(token, osTemplateId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/os_templates/${osTemplateId}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to delete OS template: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting OS template:", error);
      throw error;
    }
  }

  static async getBrands(token, params = {}) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const url = new URL(`${API_URL}/brands`);
      
      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit) {
          url.searchParams.append('limit', params.limit);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch brands: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching brands:", error);
      throw error;
    }
  }

  static async createBrand(token, brandData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/brands`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(brandData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to create brand: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating brand:", error);
      throw error;
    }
  }

  static async updateBrand(token, brandId, brandData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/brands/${brandId}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(brandData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to update brand: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating brand:", error);
      throw error;
    }
  }

  static async deleteBrand(token, brandId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/brands/${brandId}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to delete brand: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting brand:", error);
      throw error;
    }
  }

  static async getPartnerUsers(token, partnerId, params = {}) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const url = new URL(`${API_URL}/partners/${partnerId}/users`);
      
      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit || params.per_page) {
          url.searchParams.append('per_page', params.limit || params.per_page);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch partner users: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching partner users:", error);
      throw error;
    }
  }

  static async getPartnerUser(token, partnerId, userId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const url = new URL(`${API_URL}/partners/${partnerId}/users/${userId}`);
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch partner user: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching partner user:", error);
      throw error;
    }
  }

  static async createPartnerUser(token, partnerId, userData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/partners/${partnerId}/users`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to create partner user: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating partner user:", error);
      throw error;
    }
  }

  static async getEmailTemplates(token, params = {}) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const url = new URL(`${API_URL}/email-templates`);
      
      if (params) {
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.limit) {
          url.searchParams.append('limit', params.limit);
        }
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch email templates: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching email templates:", error);
      throw error;
    }
  }

  static async createEmailTemplate(token, templateData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/email-templates`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to create email template: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating email template:", error);
      throw error;
    }
  }

  static async getEmailTemplate(token, templateId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const response = await fetch(`${API_URL}/email-templates/${templateId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch email template: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching email template:", error);
      throw error;
    }
  }

  static async updateEmailTemplate(token, templateId, templateData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/email-templates/${templateId}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to update email template: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating email template:", error);
      throw error;
    }
  }

  static async deleteEmailTemplate(token, templateId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/email-templates/${templateId}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to delete email template: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting email template:", error);
      throw error;
    }
  }

  static async getEmails(token, params = {}) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const url = new URL(`${API_URL}/emails`);
      
      // Add query parameters if provided
      if (params) {
        if (params.page) {
          url.searchParams.append('page', params.page);
        }
        if (params.limit || params.per_page) {
          url.searchParams.append('per_page', params.limit || params.per_page);
        }
        if (params.search || params['filter[search]']) {
          url.searchParams.append('filter[search]', params.search || params['filter[search]']);
        }
        if (params.sort) {
          url.searchParams.append('sort', params.sort);
        }
      }
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch emails: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching emails:", error);
      throw error;
    }
  }

  static async getEmail(token, emailId) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }
      
      const response = await fetch(`${API_URL}/emails/${emailId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        throw new Error(`Failed to fetch email details: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching email details:", error);
      throw error;
    }
  }

  static async createEmail(token, emailData) {
    try {
      if (!token) {
        throw new Error("No authentication token provided");
      }

      const url = new URL(`${API_URL}/emails`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized. You have been logged out.");
        }
        let errorBody = '';
        try {
          errorBody = await response.json();
        } catch (e) { 
          try {
            errorBody = await response.text();
          } catch (e2) { /* ignore */ }
        }
        console.error("Server error response:", errorBody);
        throw new Error(`Failed to send email: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
}

export default AdminApiService;
