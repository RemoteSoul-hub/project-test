'use client'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import AdminApiService from '@/services/adminApiService';

export default function CreatePartnerPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({
    locations: [],
    plans: [],
    osTemplateGroups: [],
    brands: []
  });

  const [formData, setFormData] = useState({
    company_name: '',
    account_manager_name: '',
    account_manager_email: '',
    cc_emails: '',
    phone_number: '',
    vat_number: '',
    sales_agent: '',
    language: 'en',
    logo_url: '',
    client_support: false,
    notes: '',
    disabled: false,
    partnership_type: '',
    emails_disabled: false,
    new_server_bcc_email: '',
    new_application_bcc_email: '',
    api_access: false,
    ip_whitelist: '',
    hubspot_link: '',
    invoice_emails_enabled: true,
    reminder_emails_enabled: true,
    credit_amount: '0',
    is_auto_terminated: false,
    brand_id: '',
    username_prefix: '',
    location_plans: [],
    os_template_group_ids: []
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      const token = session?.laravelApiToken;
      if (!token) return;

      try {
        const [locations, plans, osTemplateGroups, brands] = await Promise.all([
          AdminApiService.getLocations(token),
          AdminApiService.getPlans(token),
          AdminApiService.getOsTemplateGroups(token),
          AdminApiService.getBrands(token)
        ]);

        setDropdownOptions({
          locations: locations.data || [],
          plans: plans.data || [],
          osTemplateGroups: osTemplateGroups.data || [],
          brands: brands.data || []
        });
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, [session]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLocationPlanChange = (locationId, planId, price) => {
    setFormData(prev => {
      const existingIndex = prev.location_plans.findIndex(
        lp => lp.location_id === locationId && lp.plan_id === planId
      );

      if (existingIndex >= 0) {
        const newLocationPlans = [...prev.location_plans];
        newLocationPlans[existingIndex] = { location_id: locationId, plan_id: planId, price };
        return { ...prev, location_plans: newLocationPlans };
      }

      return {
        ...prev,
        location_plans: [...prev.location_plans, { location_id: locationId, plan_id: planId, price }]
      };
    });
  };

  const handleOsTemplateGroupChange = (groupId) => {
    setFormData(prev => {
      const index = prev.os_template_group_ids.indexOf(groupId);
      if (index >= 0) {
        return {
          ...prev,
          os_template_group_ids: prev.os_template_group_ids.filter(id => id !== groupId)
        };
      }
      return {
        ...prev,
        os_template_group_ids: [...prev.os_template_group_ids, groupId]
      };
    });
  };

  // Validate form data against API rules
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    const requiredFields = [
      'company_name', 
      'language', 
      //'credit_amount', 
      'brand_id',
      'username_prefix'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `The ${field.replace('_', ' ')} field is required.`;
      }
    });
    
    // Username prefix validation
    if (formData.username_prefix && !/^[a-zA-Z0-9-]+$/.test(formData.username_prefix)) {
      newErrors.username_prefix = 'Username prefix can only contain alphanumeric characters and hyphens.';
    }
    
    // Boolean fields validation
    const booleanFields = [
      'client_support', 
      'disabled', 
      'emails_disabled', 
      'api_access', 
      'invoice_emails_enabled', 
      'reminder_emails_enabled', 
      'is_auto_terminated'
    ];
    
    booleanFields.forEach(field => {
      if (typeof formData[field] !== 'boolean') {
        newErrors[field] = `The ${field.replace('_', ' ')} field must be a boolean.`;
      }
    });
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    // Validate form before submission
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const token = session?.laravelApiToken;
      if (!token) throw new Error('No authentication token available');

      const payload = { ...formData };
      if (payload.ip_whitelist.trim() === '') {
        delete payload.ip_whitelist;
      }

      await AdminApiService.createPartner(token, payload);
      router.push('/admin/partners');
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
      <h1 className="text-2xl font-bold mb-6">Create New Partner</h1>
      
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
        {/* Required Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.company_name ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.company_name && (
              <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand <span className="text-red-500">*</span>
            </label>
            <select
              name="brand_id"
              value={formData.brand_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.brand_id ? 'border-red-500' : 'border-gray-300'}`}
              required
            >
              <option value="">Select Brand</option>
              {dropdownOptions.brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            {errors.brand_id && (
              <p className="mt-1 text-sm text-red-600">{errors.brand_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language <span className="text-red-500">*</span>
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.language ? 'border-red-500' : 'border-gray-300'}`}
              required
            >
              <option value="en">English</option>
              <option value="ro">Romanian</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
            {errors.language && (
              <p className="mt-1 text-sm text-red-600">{errors.language}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credit Amount
            </label>
            <input
              type="number"
              name="credit_amount"
              value={formData.credit_amount}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.credit_amount ? 'border-red-500' : 'border-gray-300'}`}
              min="0"
              step="0.01"
            />
            {errors.credit_amount && (
              <p className="mt-1 text-sm text-red-600">{errors.credit_amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username Prefix <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username_prefix"
              value={formData.username_prefix}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.username_prefix ? 'border-red-500' : 'border-gray-300'}`}
              required
              pattern="[a-zA-Z0-9-]+"
              title="Only alphanumeric characters and hyphens are allowed"
            />
            {errors.username_prefix && (
              <p className="mt-1 text-sm text-red-600">{errors.username_prefix}</p>
            )}
          </div>
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Manager Name
            </label>
            <input
              type="text"
              name="account_manager_name"
              value={formData.account_manager_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Manager Email
            </label>
            <input
              type="email"
              name="account_manager_email"
              value={formData.account_manager_email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CC Emails
            </label>
            <input
              type="text"
              name="cc_emails"
              value={formData.cc_emails}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="comma-separated emails"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              VAT Number
            </label>
            <input
              type="text"
              name="vat_number"
              value={formData.vat_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sales Agent
            </label>
            <input
              type="text"
              name="sales_agent"
              value={formData.sales_agent}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Partnership Type
            </label>
            <input
              type="text"
              name="partnership_type"
              value={formData.partnership_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Server BCC Email
            </label>
            <input
              type="email"
              name="new_server_bcc_email"
              value={formData.new_server_bcc_email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Application BCC Email
            </label>
            <input
              type="email"
              name="new_application_bcc_email"
              value={formData.new_application_bcc_email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IP Whitelist
            </label>
            <textarea
              name="ip_whitelist"
              value={formData.ip_whitelist}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
              placeholder="One IP per line"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hubspot Link
            </label>
            <input
              type="url"
              name="hubspot_link"
              value={formData.hubspot_link}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="client_support"
                  checked={formData.client_support}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Client Support Enabled
                </label>
              </div>
              <p className="ml-6 text-xs text-gray-500">Enable or disable client support for this partner.</p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="disabled"
                  checked={formData.disabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Disabled
                </label>
              </div>
              <p className="ml-6 text-xs text-gray-500">A disabled partner cannot log in or access the service.</p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="emails_disabled"
                  checked={formData.emails_disabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Emails Disabled
                </label>
              </div>
              <p className="ml-6 text-xs text-gray-500">Prevents any emails from being sent to this partner.</p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="api_access"
                  checked={formData.api_access}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  API Access Enabled
                </label>
              </div>
              <p className="ml-6 text-xs text-gray-500">Allows the partner to use the API.</p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="invoice_emails_enabled"
                  checked={formData.invoice_emails_enabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Invoice Emails Enabled
                </label>
              </div>
              <p className="ml-6 text-xs text-gray-500">If enabled, the partner will receive invoice-related emails.</p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="reminder_emails_enabled"
                  checked={formData.reminder_emails_enabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Reminder Emails Enabled
                </label>
              </div>
              <p className="ml-6 text-xs text-gray-500">If enabled, the partner will receive reminder emails.</p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_auto_terminated"
                  checked={formData.is_auto_terminated}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Auto Terminated
                </label>
              </div>
              <p className="ml-6 text-xs text-gray-500">If enabled, services for this partner will be automatically terminated based on rules.</p>
            </div>
          </div>
        </div>

        {/* Location Plans */}
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Location Plans</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50">Locations</th>
                  {dropdownOptions.plans.map(plan => (
                    <th key={plan.id} className="border p-2 bg-gray-50">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dropdownOptions.locations.map(location => (
                  <tr key={location.id}>
                    <td className="border p-2 font-medium">{location.name}</td>
                    {dropdownOptions.plans.map(plan => (
                      <td key={plan.id} className="border p-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.location_plans.find(
                            lp => lp.location_id === location.id && lp.plan_id === plan.id
                          )?.price || ''}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              // Remove the location_plan entry when the field is emptied
                              setFormData(prev => ({
                                ...prev,
                                location_plans: prev.location_plans.filter(
                                  lp => !(lp.location_id === location.id && lp.plan_id === plan.id)
                                )
                              }));
                            } else {
                              handleLocationPlanChange(
                                location.id,
                                plan.id,
                                parseFloat(e.target.value)
                              );
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          placeholder="Price"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OS Template Groups */}
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">OS Template Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dropdownOptions.osTemplateGroups.map(group => (
              <div key={group.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`os-template-group-${group.id}`}
                  checked={formData.os_template_group_ids.includes(group.id)}
                  onChange={() => handleOsTemplateGroupChange(group.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`os-template-group-${group.id}`} className="ml-2">
                  {group.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={() => router.push('/admin/partners')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Partner'}
          </button>
        </div>
      </form>
    </div>
  );
}
