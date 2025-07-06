'use client'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import AdminApiService from '@/services/adminApiService';

export default function EditUserPage({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: ['partner'],
    partner_id: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const token = session?.laravelApiToken;
        if (!token) throw new Error('No authentication token available');

        const data = await AdminApiService.getUsers(token, { id: params.id });
        const user = data.data[0];
        
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '', // Don't pre-fill password
          roles: user.roles || ['partner'],
          partner_id: user.partner_id || '',
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        setErrors({ general: error.message || 'Failed to load user data' });
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUser();
    }
  }, [session, params.id]);

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

      // Only include password if it's been changed
      const dataToSend = {
        ...formData,
        password: formData.password || undefined
      };

      await AdminApiService.updateUser(token, params.id, dataToSend);
      router.push(`/admin/partners/${formData.partner_id}/users`);
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.message || 'An error occurred' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit User</h1>
      
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
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
              className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Leave blank to keep current password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              name="roles"
              value={formData.roles[0]}
              onChange={(e) => setFormData(prev => ({ ...prev, roles: [e.target.value] }))}
              className={`w-full px-3 py-2 border rounded-md ${errors.roles ? 'border-red-500' : 'border-gray-300'}`}
              required
            >
              <option value="partner">Partner</option>
            </select>
            {errors.roles && (
              <p className="mt-1 text-sm text-red-600">{errors.roles}</p>
            )}
          </div>

          <input
            type="hidden"
            name="partner_id"
            value={formData.partner_id}
          />
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={() => router.push(`/admin/partners/${formData.partner_id}/users`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
} 