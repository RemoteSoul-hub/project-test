import { getAuthToken, logout } from './AuthService';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

class ApiService {
  static async request(endpoint, options = {}) {
    // Use the token from options if provided, otherwise fall back to getAuthToken
    let token = options.token || getAuthToken();
    // Remove token from options to avoid duplicating it in the headers
    if (options.token) delete options.token;

    // If no token in localStorage, check cookies
    if (!token && typeof document !== 'undefined') {
      const cookieMatch = document.cookie.match(/auth_token=([^;]+)/);
      if (cookieMatch) {
        token = cookieMatch[1];
      }
    }
    
    const defaultOptions = {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, finalOptions);

      // Check if the response has a content-type header and if it includes application/json
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        // Handle 401 Unauthorized by logging out
        if (response.status === 401) {
          logout();
        }
        
        if (isJson) {
          try {
            const error = await response.json();
            // Properly handle validation errors which may be nested
            let errors = {};
            
            // Check different possible error structures
            if (error.errors) {
              errors = error.errors;
            } else if (error.error && typeof error.error === 'object') {
              errors = error.error;
            } else if (error.error) {
              errors = { general: [error.error] };
            } else if (error.message && !error.errors) {
              // If only a message is provided without errors, set it as a general error
              errors = { general: [error.message] };
            } else {
              // Fallback for unexpected error structures
              errors = { general: ['An unknown error occurred'] };
            }
            
            throw {
              status: response.status,
              message: error.message || 'Request failed',
              errors: errors,
            };
          } catch (jsonError) {
            // If parsing JSON fails, check if jsonError is already our processed error
            if (jsonError.status && jsonError.errors) {
              throw jsonError;
            }
            
            // Otherwise, it's a JSON parsing error
            console.error('Failed to parse error response JSON:', jsonError);
            throw {
              status: response.status,
              message: 'Request failed with invalid response format',
              errors: {
                general: ['Server returned an invalid response']
              }
            };
          }
        } else {
          // Non-JSON error response
          const textResponse = await response.text();
          throw {
            status: response.status,
            message: textResponse || 'Request failed',
            errors: {
              general: ['Server returned a non-JSON response']
            }
          };
        }
      }

      // For successful responses, also check if it's JSON before parsing
      if (isJson) {
        try {
          const jsonResponse = await response.json();
          // If the response has a data property, return it directly
          if (jsonResponse.data !== undefined) {
            return jsonResponse;
          }
          // Otherwise wrap the response in a data property for consistency
          return {
            success: true,
            data: jsonResponse
          };
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          throw {
            status: 500,
            message: 'Invalid JSON response from server',
            errors: {
              general: ['Server returned an invalid JSON response']
            }
          };
        }
      } else {
        // Handle non-JSON successful responses
        const textResponse = await response.text();
        return {
          success: true,
          data: textResponse
        };
      }
    } catch (error) {
      // More robust error processing and logging
      console.error("ApiService caught error:", error); // Log the original error

      let errorMessage = 'Network error or unexpected issue'; // Default message
      let errorStatus = 500; // Default status
      let errorDetails = { general: ['Failed to connect to server or unexpected error'] };

      if (error instanceof Error) {
        errorMessage = error.message;
        // Keep default status unless error object has one
        errorStatus = error.status || 500; 
        errorDetails = error.errors || errorDetails;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle structured errors that might not be Error instances
        errorMessage = error.message || errorMessage; // Use error's message if available
        errorStatus = error.status || errorStatus;
        
        // Handle different error formats from the API
        if (error.errors && typeof error.errors === 'object') {
          // Direct errors object from our error handling above
          errorDetails = error.errors;
        } else if (error.error && typeof error.error === 'object') {
          // Some APIs return an 'error' property instead of 'errors'
          errorDetails = error.error;
        } else if (error.error && typeof error.error === 'string') {
          // Handle string error
          errorDetails = { general: [error.error] };
        } else if (error.data && error.data.errors) {
          // Some APIs nest errors inside a data property
          errorDetails = error.data.errors;
        } else if (error.response && error.response.data) {
          if (error.response.data.errors) {
            // Handle error formats from axios or similar libraries
            errorDetails = error.response.data.errors;
          } else if (error.response.data.message) {
            // If there's just a message, use it as a general error
            errorDetails = { general: [error.response.data.message] };
          }
        }
      }
      
      // Construct a new error object to ensure it has the expected structure
      const processedError = {
        status: errorStatus,
        message: errorMessage,
        errors: errorDetails,
      };
      
      console.error("ApiService throwing processed error:", processedError); // Log the error being thrown
      throw processedError; // Throw the processed error
    }
  }

  // Generic download function (might have issues with auth as reported by user)
  static async downloadFile(endpoint, params = {}, acceptHeader = '') {
    let token = getAuthToken(); // Use let to allow reassignment from cookie fallback
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    // Add cookie fallback for token, similar to request method
    if (!token && typeof document !== 'undefined') {
      const cookieMatch = document.cookie.match(/auth_token=([^;]+)/);
      if (cookieMatch) {
        token = cookieMatch[1];
        
      }
    }
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    };
    
    // Add accept header if provided
    if (acceptHeader) {
      options.headers['Accept'] = acceptHeader;
    }
    
    try {
      const response = await fetch(`${API_URL}${url}`, options);
      
      if (!response.ok) {
        // Handle 401 Unauthorized by logging out
        if (response.status === 401) {
          logout();
        }
        throw {
          status: response.status,
          message: 'Download failed',
        };
      }
      
      return await response.blob();
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 500,
        message: 'Network error occurred during download',
      };
    }
  }

  // New dedicated function for authenticated file downloads (handles token retrieval robustly)
  static async downloadExportFile(endpoint, params = {}, acceptHeader = '') {
    let token = getAuthToken(); // Get token from localStorage first

    // Fallback to checking cookies if no token in localStorage
    if (!token && typeof document !== 'undefined') {
      const cookieMatch = document.cookie.match(/auth_token=([^;]+)/);
      if (cookieMatch) {
        token = cookieMatch[1];
      }
    }

    if (!token) {
      console.error('downloadExportFile: No authentication token found. Aborting download.');
      // Optionally, trigger logout or show an error message
      // logout(); 
      throw {
        status: 401,
        message: 'Authentication required for download.',
      };
    }

    const queryString = new URLSearchParams(params).toString();
    // Ensure API_URL is prepended
    const url = queryString ? `${API_URL}${endpoint}?${queryString}` : `${API_URL}${endpoint}`;

    const options = {
      method: 'GET',
      headers: {
        // Ensure the 'Bearer ' prefix is present
        'Authorization': `Bearer ${token}`, 
      }
    };

    // Add accept header if provided
    if (acceptHeader) {
      options.headers['Accept'] = acceptHeader;
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        console.error('downloadExportFile: Download request failed with status:', response.status);
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          
          logout(); // Logout on authorization failure
        // Attempt to read error message if available
        let errorMessage = `Download failed with status ${response.status}`;
        try {
            // Try parsing JSON error first, as APIs often return structured errors
            const errorData = await response.json(); 
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            try {
                // Fallback to text error if JSON parsing fails
                errorMessage = await response.text(); 
            } catch (e2) {
                // Keep the default status message if text reading also fails
            }
        }
        throw {
          status: response.status,
          message: errorMessage,
        };
      }
      }

      return response.blob();
    } catch (error) {
      console.error('downloadExportFile: Error during download request:', error);
      // Re-throw structured error or a generic one
      if (error.status) {
        throw error;
      }
      throw {
        status: 500, // Default to 500 for unknown/network errors
        message: error.message || 'Network error occurred during download',
      };
    }
  }

  static get(endpoint, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET', ...options });
  }

  static post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      headers: { // Default headers
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...options, // Apply provided options, potentially overriding headers
      // Ensure headers from options are correctly merged (request method handles final merge)
      method: 'POST',
      headers: { // Merge headers properly
        'Accept': 'application/json', // Keep default
        'Content-Type': 'application/json', // Keep default
        ...(options.headers || {}), // Apply custom headers from options
      }
    });
  }

  static put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      headers: { // Default headers
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...options, // Apply provided options
      headers: { // Ensure headers merge correctly
        method: 'PUT',
        'Accept': 'application/json', 
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      }
    });
  }

  static patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      headers: { // Default headers
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...options, // Apply provided options
      headers: { // Ensure headers merge correctly
        method: 'PATCH',
        'Accept': 'application/json', 
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      }
    });
  }

  static async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options }); 
  }

  static async getCurrentUser() {
    
    
    try {
      // Try both endpoint formats
        const response = await this.get('/user');
        return response;
      } catch (error) {
        const response = await this.get('/user');
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  static async getPartnerTemplates(partnerId, language, options = {}) {
    try {
      // Remove query parameters as per requirement
      // Ensure we're using the correct auth token
                   (typeof window !== 'undefined' && localStorage.getItem('laravelApiToken'));
      
      // Update options with the token
      const updatedOptions = { ...options, token };
      
      // Make the API call without query parameters
      const response = await this.get('/partner-available-templates', {}, updatedOptions);
      return response; 
    } catch (error) {
      // Log or handle error as needed, then re-throw
      console.error('Error in getPartnerTemplates:', error);
      throw error;
    }
  }

  // Renamed and updated for sending test email previews
  static async sendTestEmailPreview(payload, options = {}) {
    // Payload structure:
    // {
    //   "email": "recipient@example.com",
    //   "template_id": 123,
    //   "data": { "tag1": "value1", "tag2": "value2" },
    //   "from_email": "noreply@thinkhuge.net",
    //   "from_name": "noreply",
    //   "name": "Optional Recipient Name from {name} tag" 
    // }
    return this.post('/send-preview', payload, options);
  }

  static async getUsersByServerType(serverType, params = {}) {
    // Add server type filter to params
      ...params,
      'filter[server_type]': serverType
    };
    return this.get('/users', filteredParams);
  }

  static async getServerEmails(serverId, params = {}) {
    try {
      const response = await this.get(`/servers/${serverId}/emails`, params); 
      // Return the response directly without further processing
      return response;
    } catch (error) {
      console.error('Error in getServerEmails:', error);
      throw error;
    }
  }

  static async getUserServers(userId, params = {}) {
    try {
      return this.get(`/users/${userId}/servers`, params);
    } catch (error) {
      console.error(`Error in getUserServers for userId ${userId}:`, error);
      throw error;
    }
  }

  // Methods for Partner Email Templates
  static async createPartnerEmailTemplate(data, options = {}) {
    // Corresponds to POST api/v1/partner-email-templates
    return this.post('/partner-email-templates', data, options);
  }

  static async updatePartnerEmailTemplate(partnerTemplateId, data, options = {}) {
    // Corresponds to PUT/PATCH api/v1/partner-email-templates/{partner_email_template}
    // Using PUT for a full update, can be changed to PATCH if partial updates are intended
    return this.put(`/partner-email-templates/${partnerTemplateId}`, data, options);
  }

  static async deletePartnerEmailTemplate(partnerTemplateId, options = {}) {
    // Corresponds to DELETE api/v1/partner-email-templates/{partner_email_template}
    return this.delete(`/partner-email-templates/${partnerTemplateId}`, options);
  }

  // Method for Partner Translated Email Templates
  static async getPartnerTranslatedTemplates(options = {}) {
    // Corresponds to GET /partner-translated-templates
    // Ensure options (like token) are passed correctly to the underlying 'get' or 'request' method
    return this.get('/partner-translated-templates', {}, options);
  }

  static async updatePartnerTranslationData(payload, options = {}) {
    // Corresponds to POST /update-translation-data
    // Payload might be { id: partnerTranslatedTemplateId, subject: '...', body: '...' }
    // or { email_template_id: ..., partner_id: ..., language: ..., subject: ..., body: ... }
    // Assuming the former for now, where 'id' is the ID of the partner_translated_templates record.
    return this.post('/update-translation-data', payload, options);
  }

  static async getApiLogs(partnerId, params = {}) {
    // Corresponds to GET /api/v1/partners/{partner}/api_logs
    return this.get(`/api_logs`, params);
  }
}

export default ApiService;