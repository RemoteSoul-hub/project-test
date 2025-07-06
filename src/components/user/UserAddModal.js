'use client'
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/Modal';
import DefaultApiService from '@/services/apiService';
import AdminApiService from '@/services/adminApiService';
import { getAuthToken } from '@/services/AuthService';
import { ChevronDown, Server, Loader } from 'lucide-react';

/**
 * Modal for adding a new user
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when the modal is closed
 * @param {function} props.onSuccess - Function to call when a user is successfully added
 * @param {function} [props.createFunction] - Optional function to handle user creation API call. If not provided, uses DefaultApiService.post.
 * @param {function} [props.updateFunction] - Optional function to handle user update API call.
 * @param {Object|string|number} [props.user] - User object or user ID for editing. If ID is provided, user data will be fetched from API.
 */
export default function UserAddModal({ isOpen, onClose, onSuccess, createFunction, updateFunction, user }) {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    role: 'partner'
  });
  
  const [userId, setUserId] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);
  const { data: session } = useSession();
  
  // Server creation states
  const [showServerForm, setShowServerForm] = useState(false);
  const [locations, setLocations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [osTemplates, setOsTemplates] = useState([]);
  const [serverFormData, setServerFormData] = useState({
    location_id: '',
    plan_id: '',
    os_template_id: ''
  });
  const [serverErrors, setServerErrors] = useState({});
  const [creatingServer, setCreatingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [fetchingServerData, setFetchingServerData] = useState(false);
  const [userData, setUserData] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  
  // Reset all states when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      if (user) {
        if (typeof user === 'object') {
          // We have a full user object
          setUserId(user.id);
        } else {
          // We have a user ID
          setUserId(user);
        }
      } else {
        setUserId(null);
        // Reset form when modal is opened for creating a new user
        setFormData({
          username: '',
          fullName: '',
          phoneNumber: '',
          email: '',
          password: '',
          role: 'partner'
        });
      }
    }
    
    // Always reset these states when modal opens or closes
    if (!isOpen || (isOpen && !user)) {
      setShowServerForm(false);
      setServerFormData({
        location_id: '',
        plan_id: '',
        os_template_id: ''
      });
      setServerStatus(null);
      setUserStatus(null);
      setErrors({});
      setServerErrors({});
    }
  }, [isOpen, user]);
  
  // Fetch user data if we only have the ID
  useEffect(() => {
    if (isOpen && userId && typeof user !== 'object') {
      const authToken = session?.laravelApiToken || getAuthToken();
      if (!authToken) {
        setUserError('No authentication token available to fetch user data');
        return;
      }
      
      setUserLoading(true);
      setUserError(null);
      
      AdminApiService.getUser(authToken, userId)
        .then(response => {
          const userData = response.data; // Extract user data from the 'data' property
          
          setFormData({
            username: userData.username || '',
            fullName: userData.name || '',
            phoneNumber: userData.phone_number || '',
            email: userData.email || '',
            password: '', // Keep password empty for editing
            role: userData.roles && userData.roles.length > 0 ? userData.roles[0] : 'partner'
          });
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          setUserError(`Failed to load user data: ${error.message}`);
        })
        .finally(() => {
          setUserLoading(false);
        });
    }
  }, [isOpen, userId, user, session]);
  
  // Set form data if we have a full user object
  useEffect(() => {
    if (user && typeof user === 'object') {
      
      
      setFormData({
        username: user.username || '',
        fullName: user.name || '',
        phoneNumber: user.phone_number || '',
        email: user.email || '',
        password: '',
        role: user.roles && user.roles.length > 0 ? user.roles[0] : 'partner'
      });
    }
  }, [user]);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [userStatus, setUserStatus] = useState(null);
  
  // Available roles
  const roleOptions = ['partner', 'user'];
  
  // Fetch server creation data (locations, plans, OS templates)
  useEffect(() => {
    if (isOpen && showServerForm && !fetchingServerData) {
      fetchServerData();
    }
  }, [isOpen, showServerForm]);
  
  // Update price when location or plan changes
  useEffect(() => {
    if (userData && serverFormData.location_id && serverFormData.plan_id) {
      updatePrice(serverFormData.location_id, serverFormData.plan_id);
    }
  }, [userData, serverFormData.location_id, serverFormData.plan_id]);
  
  const fetchServerData = async () => {
    setFetchingServerData(true);
    try {
      // Fetch locations, plans, OS templates, and user data in parallel
      // DefaultApiService already handles authentication internally
      const [locationsResponse, plansResponse, osTemplatesResponse, userDataResponse] = await Promise.all([
        DefaultApiService.get('/locations'),
        DefaultApiService.get('/plans'),
        DefaultApiService.get('/os_templates'),
        DefaultApiService.get('/user')
      ]);
      
      setUserData(userDataResponse.data);
      
      setLocations(locationsResponse.data || []);
      setPlans(plansResponse.data || []);
      setOsTemplates(osTemplatesResponse.data || []);
      
      // Preselect first options if available
      if (locationsResponse.data && locationsResponse.data.length > 0) {
        setServerFormData(prev => ({ ...prev, location_id: locationsResponse.data[0].id.toString() }));
      }
      
      if (plansResponse.data && plansResponse.data.length > 0) {
        setServerFormData(prev => ({ ...prev, plan_id: plansResponse.data[0].id.toString() }));
      }
      
      if (osTemplatesResponse.data && osTemplatesResponse.data.length > 0) {
        setServerFormData(prev => ({ ...prev, os_template_id: osTemplatesResponse.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching server data:', error);
      setServerErrors({ general: `Failed to load server data: ${error.message}` });
    } finally {
      setFetchingServerData(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const updatePrice = (locationId, planId) => {
    if (!userData || !userData.partner || !userData.partner.location_plans) {
      return;
    }

    const locationPlan = userData.partner.location_plans.find(
      lp => lp.location.id.toString() === locationId && lp.plan.id.toString() === planId
    );

    if (locationPlan) {
      setCurrentPrice(locationPlan.price);
    } else {
      setCurrentPrice(null);
    }
  };
  
  const handleServerFormChange = (e) => {
    const { name, value } = e.target;
    setServerFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user types
    if (serverErrors[name]) {
      setServerErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length > 255) {
      newErrors.fullName = 'Full name must be less than 255 characters';
    }

    // Username validation (nullable, but must match pattern if provided)
    if (formData.username.trim() && !/^[a-zA-Z0-9-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and hyphens';
    } else if (formData.username.length > 255) {
      newErrors.username = 'Username must be less than 255 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!userId && !formData.password) {
      newErrors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Phone number validation (nullable)
    if (formData.phoneNumber.length > 50) {
      newErrors.phoneNumber = 'Phone number must be less than 50 characters';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setUserStatus(userId ? 'Updating user...' : 'Creating user...');

    try {
      // Map form data to API expected format
      const userData = {
        username: formData.username || null,
        name: formData.fullName,
        phone_number: formData.phoneNumber || null,
        email: formData.email,
        roles: [formData.role] // Send as array for API
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      let createdUserId;
      let response;

      if (userId) {
        // Call the provided update function
        if (updateFunction) {
          await updateFunction(userId, userData);
        } else {
          throw new Error('Update function is not provided');
        }
        createdUserId = userId;
      } else {
        // Call the provided create function or the default API service
        if (createFunction) {
          response = await createFunction(userData);
        } else {
          // Post to /users
          response = await DefaultApiService.post('/users', userData);
        }
        
        // Extract the user ID from the response
        createdUserId = response?.data?.id;
      }

      // Update user status
      setUserStatus(userId ? 'User updated successfully!' : 'User created successfully!');
      
      // If we're creating a server, proceed with that
      if (showServerForm && createdUserId) {
        await createServer(createdUserId);
      } else {
        // Show success message briefly before closing
        setTimeout(() => {
          // Reset form and close modal
          setFormData({
            username: '',
            fullName: '',
            phoneNumber: '',
            email: '',
            password: '',
            role: 'partner'
          });

          // Call success callback
          if (onSuccess) {
            onSuccess();
          }

          // Close modal
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);

      // Handle API validation errors
      if (error.errors) {
        const apiErrors = {};
        
        // Map API error fields to form fields
        Object.entries(error.errors).forEach(([key, messages]) => {
          switch (key) {
            case 'username':
              apiErrors.username = Array.isArray(messages) ? messages[0] : messages;
              break;
            case 'name':
              apiErrors.fullName = Array.isArray(messages) ? messages[0] : messages;
              break;
            case 'phone_number':
              apiErrors.phoneNumber = Array.isArray(messages) ? messages[0] : messages;
              break;
            case 'password':
              apiErrors.password = Array.isArray(messages) ? messages[0] : messages;
              break;
            case 'email':
              apiErrors.email = Array.isArray(messages) ? messages[0] : messages;
              break;
            case 'roles':
              apiErrors.role = Array.isArray(messages) ? messages[0] : messages;
              break;
            default:
              // For other field errors or if the messages aren't in the expected format
              if (typeof messages === 'string') {
                apiErrors[key] = messages;
              } else if (Array.isArray(messages) && messages.length > 0) {
                apiErrors[key] = messages[0];
              } else if (typeof messages === 'object' && messages !== null) {
                // Handle the case where messages is an object, typically with field-specific errors
                apiErrors[key] = JSON.stringify(messages);
              }
          }
        });

        // If we have a message property in the error, use it for the general error text
        if (error.message) {
          apiErrors.general = error.message;
        }

        setErrors(apiErrors);
        
        // Set a more specific user status if we have field errors
        if (apiErrors.username) {
          setUserStatus(`Error: ${apiErrors.username}`);
        } else if (Object.keys(apiErrors).length > 0) {
          // If we have other field errors, use the first one as the status
          const firstErrorField = Object.keys(apiErrors)[0];
          setUserStatus(`Error: ${apiErrors[firstErrorField]}`);
        } else {
          setUserStatus('Failed to create user');
        }
    } else {
      // Set general error, extracting only the "message" field from JSON if present
      let errorMessage = 'An error occurred while creating/updating the user';

      // Try to extract error details from different possible formats
      if (error.errors) {
        // Directly use field-level errors if they exist
        const apiErrors = {};
        Object.entries(error.errors).forEach(([key, messages]) => {
          if (key === 'username' || key === 'name' || key === 'phone_number' || key === 'email' || key === 'roles') {
            const fieldKey = key === 'name' ? 'fullName' : key === 'roles' ? 'role' : key;
            apiErrors[fieldKey] = Array.isArray(messages) ? messages[0] : messages;
          } else {
            // For other fields or if the format is unexpected
            if (typeof messages === 'string') {
              apiErrors[key] = messages;
            } else if (Array.isArray(messages) && messages.length > 0) {
              apiErrors[key] = messages[0];
            } else if (typeof messages === 'object' && messages !== null) {
              apiErrors[key] = JSON.stringify(messages);
            }
          }
        });
        setErrors(apiErrors);
        
        // Set the user status to the first error found
        if (Object.keys(apiErrors).length > 0) {
          const firstKey = Object.keys(apiErrors)[0];
          setUserStatus(`Error: ${apiErrors[firstKey]}`);
          return; // Exit early since we've set field-specific errors
        }
      }
      
      // If we couldn't extract field-level errors, try to get a general error message
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Set the general error status
      setUserStatus(`Failed to create user: ${errorMessage}`);
      setErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Create server with the user ID
  const createServer = async (userId) => {
    setCreatingServer(true);
    setServerStatus('Creating server...');
    
    try {
      // Prepare server data
      const serverData = {
        ...serverFormData,
        user_id: userId.toString()
      };
      
      // Create server
      const response = await DefaultApiService.post('/servers', serverData);
      
      // Update status
      setServerStatus('Server created successfully!');
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after a delay to show success message
      setTimeout(() => {
        // Reset form
        setFormData({
          username: '',
          fullName: '',
          phoneNumber: '',
          email: '',
          password: '',
          role: 'partner'
        });
        
        setShowServerForm(false);
        setServerFormData({
          location_id: '',
          plan_id: '',
          os_template_id: ''
        });
        
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating server:', error);
      
      // Handle API validation errors
      if (error.errors) {
        const apiErrors = {};
        
        // Map API error fields to form fields
        Object.entries(error.errors).forEach(([key, messages]) => {
          apiErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        
        // If we have a message property in the error, use it for the general error
        if (error.message) {
          apiErrors.general = error.message;
        }
        
        setServerErrors(apiErrors);
        
        // Set a more specific server status if we have field errors
        const firstErrorField = Object.keys(apiErrors)[0];
        if (firstErrorField) {
          setServerStatus(`Error: ${apiErrors[firstErrorField]}`);
        } else {
          setServerStatus('Failed to create server');
        }
      } else {
        // Set general error
        setServerErrors({
          general: error.message || 'An error occurred while creating the server'
        });
        setServerStatus(`Failed to create server: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setCreatingServer(false);
    }
  };
  

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userId ? "Update User" : "Add New User"}
      size="lg"
      closeOnClickOutside={false} // Prevent closing on outside click
      confirmOnClose={true}       // Enable confirmation before closing
    >
      <form onSubmit={handleSubmit}>
        {/* User Status with error messages */}
        {userStatus && (
          <div className={`mb-4 p-3 rounded-md ${
            userStatus.includes('Error:') || userStatus.includes('Failed') 
              ? 'bg-red-50 text-red-600' 
              : userStatus.includes('success') 
                ? 'bg-green-50 text-green-600'
                : 'bg-blue-50 text-blue-600'
          }`}>
            {loading && (
              <Loader size={16} className="inline-block animate-spin mr-2" />
            )}
            {userStatus}
          </div>
        )}
        
        {/* General error message */}
        {errors.general && !userStatus?.includes('Failed') && !userStatus?.includes('Error:') && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
            {errors.general}
          </div>
        )}

        {/* Username */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter username"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={userId ? "Enter new password (optional)" : "Enter password"}
            autoComplete="new-password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Full Name */}
        <div className="mb-4">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter full name"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="mb-4">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter phone number"
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
          )}
        </div>



        {/* Role */}
        <div className="mb-4 md:mb-6">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Permissions
          </label>
          <div className="relative">
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md appearance-none pr-10 ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
            >
              {roleOptions.map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <ChevronDown size={16} className="text-gray-500" />
            </div>
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
          )}
        </div>
        
        {/* Create Server Button (show for all user types) */}
        {!userId && (
          <div className="mb-4 md:mb-6">
            <button
              type="button"
              onClick={() => {
                setShowServerForm(!showServerForm);
                if (!showServerForm && !locations.length) {
                  fetchServerData();
                }
              }}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Server size={16} className="mr-1" />
              {showServerForm ? 'Hide server form' : 'Create new server'}
            </button>
          </div>
        )}
        
        {/* Server Creation Form */}
        {showServerForm && (
          <div className="border-t pt-3 md:pt-4 mt-3 md:mt-4">
            <h3 className="text-lg font-medium mb-2 md:mb-4">Server Details</h3>
            
            {/* Server form general error */}
            {serverErrors.general && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                {serverErrors.general}
              </div>
            )}
            
            {fetchingServerData ? (
              <div className="flex justify-center items-center py-4">
                <Loader size={24} className="animate-spin text-blue-500 mr-2" />
                <span>Loading server options...</span>
              </div>
            ) : (
              <>
                {/* Location and Plan Selection (same row) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-2 md:mb-4">
                  {/* Location Selection */}
                  <div>
                    <label htmlFor="location_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <select
                      id="location_id"
                      name="location_id"
                      value={serverFormData.location_id}
                      onChange={handleServerFormChange}
                      className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md ${serverErrors.location_id ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    >
                      <option value="">Select a location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name} ({location.country_code.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    {serverErrors.location_id && (
                      <p className="mt-1 text-sm text-red-600">{serverErrors.location_id}</p>
                    )}
                  </div>
                  
                  {/* Plan Selection */}
                  <div>
                    <label htmlFor="plan_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Plan
                    </label>
                    <select
                      id="plan_id"
                      name="plan_id"
                      value={serverFormData.plan_id}
                      onChange={handleServerFormChange}
                      className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md ${serverErrors.plan_id ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    >
                      <option value="">Select a plan</option>
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                    {serverErrors.plan_id && (
                      <p className="mt-1 text-sm text-red-600">{serverErrors.plan_id}</p>
                    )}
                  </div>
                </div>
                
                {/* OS Template Selection */}
                <div className="mb-2 md:mb-4">
                  <label htmlFor="os_template_id" className="block text-sm font-medium text-gray-700 mb-1">
                    OS Template
                  </label>
                  <select
                    id="os_template_id"
                    name="os_template_id"
                    value={serverFormData.os_template_id}
                    onChange={handleServerFormChange}
                    className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md ${serverErrors.os_template_id ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  >
                    <option value="">Select a template</option>
                    {osTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.is_ut ? "(UT)" : ""}
                      </option>
                    ))}
                  </select>
                  {serverErrors.os_template_id && (
                    <p className="mt-1 text-sm text-red-600">{serverErrors.os_template_id}</p>
                  )}
                </div>
                
                {/* Plan Details */}
                {serverFormData.location_id && serverFormData.plan_id && (
                  <div className="mb-2 md:mb-4 p-2 md:p-4 bg-gray-50 rounded-md border border-gray-200">
                    <h4 className="text-md font-medium mb-2">Plan Details</h4>
                    
                    {/* Find the selected plan to display its details */}
                    {(() => {
                      const selectedPlan = plans.find(p => p.id.toString() === serverFormData.plan_id);
                      if (!selectedPlan) return <p>Loading plan details...</p>;
                      
                      return (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">CPU:</span>
                            <span className="font-medium">{selectedPlan.cpu_count} Cores</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">RAM:</span>
                            <span className="font-medium">{selectedPlan.memory_size / 1024} GB</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Storage:</span>
                            <span className="font-medium">{selectedPlan.disk_size} GB</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bandwidth:</span>
                            <span className="font-medium">{selectedPlan.bandwidth_size} GB</span>
                          </div>
                          
                          {/* Price information */}
                          {currentPrice !== null && (
                            <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
                              <div className="flex justify-between text-base">
                                <span className="font-medium">Price:</span>
                                <span className="font-bold text-blue-600">${currentPrice}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
            
            {/* Server Status */}
            {serverStatus && (
              <div className={`p-3 rounded-md mb-4 ${
                serverStatus.includes('Error:') || serverStatus.includes('Failed') 
                  ? 'bg-red-50 text-red-600' 
                  : serverStatus.includes('success') 
                    ? 'bg-green-50 text-green-600'
                    : 'bg-blue-50 text-blue-600'
              }`}>
                {creatingServer && (
                  <Loader size={16} className="inline-block animate-spin mr-2" />
                )}
                {serverStatus}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-4 md:mt-6 pt-3 md:pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-3 md:px-4 py-1.5 md:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading || creatingServer}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || creatingServer}
          >
            {loading ? 'Saving...' : userId ? 'Update User' : showServerForm ? 'Add User & Create Server' : 'Add User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
