'use client'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { use } from 'react';
import AdminApiService from '@/services/adminApiService';

export default function EditPartnerUserPage({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);

  const partnerId = use(params).id;
  const userId = use(params).userId;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    roles: ['partner'],
    partner_id: partnerId,
  });

  // Fetch user data when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setInitialLoading(true);
        const token = session?.laravelApiToken;
        if (!token) throw new Error('No authentication token available');

        // Fetch the specific user
        const response = await AdminApiService.getUser(token, userId);
        const user = response.data;
        
        if (!user) {
          throw new Error('User not found');
        }

        // Set the form data
        setFormData({
          username: user.username || '',
          email: user.email || '',
          name: user.name || '',
          password: '', // Password is empty for editing
          roles: user.roles || ['partner'],
          partner_id: partnerId,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrors({ general: error.message || 'Failed to fetch user data' });
      } finally {
        setInitialLoading(false);
      }
    };

    if (session) {
      fetchUserData();
    }
  }, [session, partnerId, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const token = session?.laravelApiToken;
      if (!token) throw new Error('No authentication token available');

      // Create a copy of the form data for submission
      const userData = { ...formData };
      
      // If password is empty, remove it from the request
      if (!userData.password) {
        delete userData.password;
      }

      // Update the user
      await AdminApiService.updateUser(token, userId, userData);
      
      // Redirect back to the users list
      router.push(`/admin/partners/${partnerId}/users`);
    } catch (error) {
      console.error('Update error:', error);
      
      // Initialize errors object with general message
      const newErrors = {
        general: 'Failed to update user'
      };
      
      // Try to extract error details from the error message
      const errorMessage = error.toString();
      
      
      // Check if the error message contains JSON
      if (errorMessage.includes('{') && errorMessage.includes('}')) {
        try {
          // Extract the JSON part from the error message
          const jsonStart = errorMessage.indexOf('{');
          const jsonEnd = errorMessage.lastIndexOf('}') + 1;
          const jsonStr = errorMessage.substring(jsonStart, jsonEnd);
          
          
          const errorData = JSON.parse(jsonStr);
          
          
          // Update general error message
          if (errorData.message) {
            newErrors.general += `. Details: ${errorData.message}`;
          }
          
          // Set field-specific errors
          if (errorData.errors) {
            for (const [field, messages] of Object.entries(errorData.errors)) {
              newErrors[field] = Array.isArray(messages) ? messages[0] : messages;
              
            }
          }
        } catch (e) {
          console.error('Error parsing JSON from error message:', e);
        }
      }
      
      // Hardcode username error for testing
      newErrors.username = 'The username format is invalid.';
      
      
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Partner User</h1>
      
      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-md shadow-sm">
          <p className="font-medium">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              aria-invalid={errors.username ? 'true' : 'false'}
            />
            {errors.username ? (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">{errors.username}</p>
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              aria-invalid={errors.email ? 'true' : 'false'}
              required
            />
            {errors.email ? (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">{errors.email}</p>
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              aria-invalid={errors.name ? 'true' : 'false'}
              required
            />
            {errors.name ? (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">{errors.name}</p>
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password (leave empty to keep current)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password ? (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">{errors.password}</p>
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              name="roles"
              value={formData.roles[0]}
              onChange={(e) => setFormData(prev => ({ ...prev, roles: [e.target.value] }))}
              className={`w-full px-3 py-2 border rounded-md ${errors.roles ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              aria-invalid={errors.roles ? 'true' : 'false'}
              required
            >
              <option value="partner">Partner</option>
              <option value="user">User</option>
            </select>
            {errors.roles ? (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">{errors.roles}</p>
              </div>
            ) : null}
          </div>

          <input
            type="hidden"
            name="partner_id"
            value={partnerId}
          />
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={() => router.push(`/admin/partners/${partnerId}/users`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
