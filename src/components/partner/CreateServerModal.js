import React, { useEffect, useState, useRef } from 'react';
import Modal from '../Modal';
import ApiService from '../../services/apiService';
import { getAuthToken, isImpersonating } from '../../services/AuthService';
import { Calendar, Loader } from 'lucide-react'; // Added Loader import
import { Info, Search, X, User, Plus, ArrowLeft } from 'lucide-react';

export default function CreateServerModal({ isOpen, onClose, onServerCreated }) {
  // State for server creation
  const [loading, setLoading] = useState(false);
  const [creatingServer, setCreatingServer] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [form, setForm] = useState({
    user_id: '',
    location_id: '',
    plan_id: '',
    os_template_id: '',
    is_test_server: false,
    terminate_at: ''
  });

  // Check if user is impersonated
  const [isImpersonated, setIsImpersonated] = useState(false);
  const [errors, setErrors] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // State for user search and selection
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const searchInputRef = useRef(null);

  // State for user creation
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone_number: '',
    role: 'user'
  });
  const [userFormErrors, setUserFormErrors] = useState({});

  // State for server options
  const [locations, setLocations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [osTemplates, setOsTemplates] = useState([]);
  const [userData, setUserData] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);

  // Fetch all required data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFetchingData(true);
      setErrors(null);
      setFetchError(null);

      // Check if user is impersonated
      setIsImpersonated(isImpersonating());

      Promise.all([
        fetchUsers(),
        fetchLocations(),
        fetchPlans(),
        fetchOsTemplates(),
        fetchUserData()
      ])
        .then(() => {
          setFetchingData(false);
        })
        .catch(err => {
          setFetchError(err.message || 'Failed to load data');
          setFetchingData(false);
        });
    } else {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setForm({
      user_id: '',
      location_id: '',
      plan_id: '',
      os_template_id: '',
      is_test_server: false,
      terminate_at: ''
    });
    setErrors(null);
    setFetchError(null);
    setCurrentPrice(null);
    setShowCreateUserForm(false);
    setUserFormData({
      username: '',
      name: '',
      email: '',
      phone_number: '',
      role: 'user'
    });
    setUserFormErrors({});
  };

  // API calls
  const fetchUserData = async () => {
    try {
      const response = await ApiService.get('/user');
      setUserData(response.data);
      return response;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await ApiService.get('/users');
      setUsers(response.data || []);

      // Preselect first user if available
      if (response.data && response.data.length > 0) {
        setForm(prev => ({ ...prev, user_id: response.data[0].id.toString() }));
        setSelectedUser(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const searchUsers = async (search) => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const params = {
        'filter[search]': search,
        limit: 5
      };

      const data = await ApiService.getUsersByServerType('virtual', params);
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await ApiService.get('/locations');
      setLocations(response.data || []);

      // Preselect first location if available
      if (response.data && response.data.length > 0) {
        setForm(prev => ({ ...prev, location_id: response.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await ApiService.get('/plans');
      setPlans(response.data || []);

      // Preselect first plan if available
      if (response.data && response.data.length > 0) {
        setForm(prev => ({ ...prev, plan_id: response.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  };

  const fetchOsTemplates = async () => {
    try {
      const response = await ApiService.get('/os_templates');
      setOsTemplates(response.data || []);

      // Preselect first template if available
      if (response.data && response.data.length > 0) {
        setForm(prev => ({ ...prev, os_template_id: response.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching OS templates:', error);
      throw error;
    }
  };

  // Handle search input changes with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchUsers(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Update price when location or plan changes
  useEffect(() => {
    if (userData && form.location_id && form.plan_id) {
      updatePrice(form.location_id, form.plan_id);
    }
  }, [userData, form.location_id, form.plan_id]);

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

  const handleChange = e => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }

    // Update price when location or plan changes
    if (name === 'location_id' || name === 'plan_id') {
      updatePrice(form.location_id, form.plan_id);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setCreatingServer(true);
    setErrors(null);

    try {
      // Prepare payload
      const payload = {
        user_id: form.user_id,
        location_id: form.location_id,
        plan_id: form.plan_id,
        os_template_id: form.os_template_id
      };

      // Only include is_test_server if it's checked
      if (form.is_test_server) {
        payload.is_test_server = true;

        // Only include terminate_at if is_test_server is true and user is impersonated
        if (isImpersonated && form.terminate_at) {
          payload.terminate_at = form.terminate_at;
        }
      }

      await ApiService.post('/servers', payload);
      if (onServerCreated) onServerCreated();
      setTimeout(() => {
        setCreatingServer(false);
        onClose();
      }, 500);
    } catch (err) {
      if (err.errors || err.message) {
        const mergedErrors = { ...err.errors };
        if (err.message) {
          mergedErrors.general = [err.message];
        }
        setErrors(mergedErrors);
      } else {
        setErrors({ general: ['An unexpected error occurred.'] });
      }
      setCreatingServer(false);
    } finally {
      setLoading(false);
    }
  };

  // Create a new user
  const createUser = async () => {
    // Validate form
    const errors = {};
    if (!userFormData.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!userFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+.\S+/.test(userFormData.email)) {
      errors.email = 'Email is invalid';
    }

    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      return;
    }

    // Create user
    setCreatingUser(true);
    try {
      // Prepare user data with roles as array
      const userData = {
        ...userFormData,
        roles: [userFormData.role]
      };

      // Create user
      const response = await ApiService.post('/users', userData);

      // Get the created user
      const newUser = response.data;

      // Update selected user and form
      setSelectedUser(newUser);
      setForm(prev => ({ ...prev, user_id: newUser.id.toString() }));

      // Hide create user form
      setShowCreateUserForm(false);

      // Reset user form data
      setUserFormData({
        username: '',
        name: '',
        email: '',
        phone_number: '',
        role: 'user'
      });
    } catch (error) {
      console.error('Error creating user:', error);

      // Handle API validation errors
      if (error.errors) {
        const apiErrors = {};
        Object.entries(error.errors).forEach(([key, messages]) => {
          apiErrors[key] = messages[0];
        });
        setUserFormErrors(apiErrors);
      } else {
        setUserFormErrors({
          general: error.message || 'An error occurred while creating the user'
        });
      }
    } finally {
      setCreatingUser(false);
    }
  };

  // Find the selected OS template to check if it's a UT template
  const selectedTemplate = osTemplates.find(
    template => template.id.toString() === form.os_template_id
  );

  const isUtTemplate = selectedTemplate?.is_ut || false;
  const isUtDualUser = selectedTemplate?.is_ut_dual_user || false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={creatingServer ? null : onClose}
      title="Create Virtual Server"
      size="lg"
      closeOnClickOutside={false} // Prevent closing on outside click
      confirmOnClose={true}       // Enable confirmation before closing
    >
      {/* Loading overlay when creating server */}
      {creatingServer && (
        <div className="absolute inset-0 bg-white bg-opacity-80 z-10 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Creating your server...</p>
          <p className="text-sm text-gray-500 mt-2">This may take several seconds</p>
        </div>
      )}

      {fetchingData && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading data...</span>
        </div>
      )}

      {fetchError && !fetchingData && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error loading data</p>
          <p>{fetchError}</p>
        </div>
      )}

      {!fetchingData && !fetchError && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection with Search or Create New User Form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {showCreateUserForm ? "Create New User" : "User"}
            </label>

            {showCreateUserForm ? (
              /* Create User Form */
              <div className="space-y-4">
                <div className="flex items-center mb-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserForm(false)}
                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    <ArrowLeft size={16} className="mr-1" /> Back to user selection
                  </button>
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={userFormData.username}
                    onChange={(e) => {
                      setUserFormData(prev => ({ ...prev, username: e.target.value }));
                      if (userFormErrors.username) {
                        setUserFormErrors(prev => ({ ...prev, username: null }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md ${userFormErrors.username ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter username"
                  />
                  {userFormErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{userFormErrors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userFormData.email}
                    onChange={(e) => {
                      setUserFormData(prev => ({ ...prev, email: e.target.value }));
                      if (userFormErrors.email) {
                        setUserFormErrors(prev => ({ ...prev, email: null }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md ${userFormErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter email"
                    required
                  />
                  {userFormErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{userFormErrors.email}</p>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userFormData.name}
                    onChange={(e) => {
                      setUserFormData(prev => ({ ...prev, name: e.target.value }));
                      if (userFormErrors.name) {
                        setUserFormErrors(prev => ({ ...prev, name: null }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md ${userFormErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter full name"
                    required
                  />
                  {userFormErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{userFormErrors.name}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    className={`w-full px-3 py-2 border rounded-md ${
                      userFormErrors.phone_number
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {userFormErrors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{userFormErrors.phone_number}</p>
                  )}
                </div>
              </div>
            ) : (
              /* User Selection with Search */
              <div className="relative">
                <div className="relative flex items-center"> {/* Added 'relative' here */}
                  <input
                    type="text"
                    ref={searchInputRef}
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border rounded-md border-gray-300" /* Adjusted padding */
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 100)}
                  />
                  <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" /> {/* Added pointer-events-none so icon doesn't block input focus */}
                </div>
                {searchLoading && (
                  <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-50 z-10 flex items-center justify-center">
                    <Loader className="animate-spin" />
                  </div>
                )}
                {searchResults.length > 0 && isDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-full bg-white rounded-md shadow-lg z-20 border border-gray-200">
                    <ul>
                      {searchResults.map(user => (
                        <li
                          key={user.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedUser(user);
                            setForm(prev => ({ ...prev, user_id: user.id.toString() }));
                            setSearchTerm('');
                            setSearchResults([]);
                            if (searchInputRef.current) {
                              searchInputRef.current.blur();
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <User size={16} className="mr-2" />
                            <span>{user.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!showCreateUserForm && (
                  <div className="flex items-center mt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateUserForm(true)}
                      className="text-green-600 hover:text-green-800 flex items-center text-sm"
                    >
                      <Plus size={16} className="mr-1" /> Create New User
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Server Configuration */}
          <div className="space-y-4">
            {/* Location */}
            <div>
              <label
                htmlFor="location_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Location
              </label>
              <select
                id="location_id"
                name="location_id"
                value={form.location_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md border-gray-300"
                required
              >
                <option value="">Select a location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan */}
            <div>
              <label
                htmlFor="plan_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Plan
              </label>
              <select
                id="plan_id"
                name="plan_id"
                value={form.plan_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md border-gray-300"
                required
              >
                <option value="">Select a plan</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Information */}
            {form.plan_id && (
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-semibold mb-2">Plan Details</h3>
                {plans
                  .filter(plan => plan.id.toString() === form.plan_id)
                  .map(plan => (
                    <div key={plan.id}>
                      <p>
                        <strong>CPU:</strong> {plan.cpu_count} x {plan.cpu_type}
                      </p>
                      <p>
                        <strong>Memory:</strong> {plan.memory_size / 1024} GB
                      </p>
                      <p>
                        <strong>Storage:</strong> {plan.disk_size} GB
                      </p>
                    </div>
                  ))}
                {currentPrice !== null ? (
                  <p className="mt-2 text-green-600 font-semibold">
                    Price: ${currentPrice} / month
                  </p>
                ) : (
                  <p className="mt-2 text-gray-600">Price not available</p>
                )}
              </div>
            )}

            {/* OS Template */}
            <div>
              <label
                htmlFor="os_template_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                OS Template
              </label>
              <select
                id="os_template_id"
                name="os_template_id"
                value={form.os_template_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md border-gray-300"
                required
              >
                <option value="">Select an OS template</option>
                {osTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Server Options (only show if user is impersonated) */}
          {isImpersonated && (
            <div className="space-y-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="is_test_server"
                  checked={form.is_test_server}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">Is this a test server?</span>
              </label>

              {form.is_test_server && (
                <div>
                  <label htmlFor="terminate_at" className="block text-sm font-medium text-gray-700 mb-1">
                    Termination Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="terminate_at"
                      name="terminate_at"
                      value={form.terminate_at}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md border-gray-300"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {errors && errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md mr-2"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
