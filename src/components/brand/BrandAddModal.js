'use client'
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import AdminApiService from '@/services/adminApiService';
import { useSession } from "next-auth/react";

export default function BrandAddModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  createFunction, 
  updateFunction, 
  brand 
}) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    tax_rate: '',
    address: '',
    billing_email: '',
    bank_details: '',
    solus2_tag_id: '',
    broker_id: '',
    acronis_brand: false,
    support_name: '',
    support_email: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || '',
        tax_rate: brand.tax_rate || '',
        address: brand.address || '',
        billing_email: brand.billing_email || '',
        bank_details: brand.bank_details || '',
        solus2_tag_id: brand.solus2_tag_id || '',
        broker_id: brand.broker_id || '',
        acronis_brand: brand.acronis_brand || false,
        support_name: brand.support_name || '',
        support_email: brand.support_email || ''
      });
    } else {
      setFormData({
        name: '',
        tax_rate: '',
        address: '',
        billing_email: '',
        bank_details: '',
        solus2_tag_id: '',
        broker_id: '',
        acronis_brand: false,
        support_name: '',
        support_email: ''
      });
    }
  }, [brand]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.tax_rate) {
      newErrors.tax_rate = 'Tax rate is required';
    } else if (isNaN(formData.tax_rate)) {
      newErrors.tax_rate = 'Tax rate must be a number';
    } else {
      const taxRate = parseFloat(formData.tax_rate);
      if (taxRate < 0 || taxRate > 100) {
        newErrors.tax_rate = 'Tax rate must be between 0 and 100';
      }
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.billing_email.trim()) {
      newErrors.billing_email = 'Billing email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.billing_email)) {
      newErrors.billing_email = 'Email is invalid';
    }
    
    if (!formData.bank_details.trim()) {
      newErrors.bank_details = 'Bank details are required';
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
    
    try {
      const brandData = {
        name: formData.name,
        tax_rate: Math.min(100, Math.max(0, parseFloat(formData.tax_rate))),
        address: formData.address,
        billing_email: formData.billing_email,
        bank_details: formData.bank_details,
        solus2_tag_id: formData.solus2_tag_id ? formData.solus2_tag_id : null,
        broker_id: formData.broker_id || null,
        acronis_brand: formData.acronis_brand,
        support_name: formData.support_name || null,
        support_email: formData.support_email || null
      };

      if (brand) {
        await updateFunction(brand.id, brandData);
      } else {
        await createFunction(brandData);
      }
      
      setFormData({
        name: '',
        tax_rate: '',
        address: '',
        billing_email: '',
        bank_details: ''
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating/updating brand:', error);
      
      if (error.errors) {
        const apiErrors = {};
        Object.entries(error.errors).forEach(([key, messages]) => {
          apiErrors[key] = messages[0];
        });
        setErrors(apiErrors);
      } else {
        setErrors({
          general: error.message || 'An error occurred'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={brand ? "Update Brand" : "Add New Brand"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
            {errors.general}
          </div>
        )}
        
        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter brand name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        
        {/* Tax Rate */}
        <div className="mb-4">
          <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1">
            Tax Rate *
          </label>
          <input
            type="number"
            id="tax_rate"
            name="tax_rate"
            value={formData.tax_rate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.tax_rate ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter tax rate"
            step="0.01"
            min="0"
          />
          {errors.tax_rate && (
            <p className="mt-1 text-sm text-red-600">{errors.tax_rate}</p>
          )}
        </div>
        
        {/* Address */}
        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter address"
            rows="3"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>
        
        {/* Billing Email */}
        <div className="mb-4">
          <label htmlFor="billing_email" className="block text-sm font-medium text-gray-700 mb-1">
            Billing Email *
          </label>
          <input
            type="email"
            id="billing_email"
            name="billing_email"
            value={formData.billing_email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.billing_email ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter billing email"
          />
          {errors.billing_email && (
            <p className="mt-1 text-sm text-red-600">{errors.billing_email}</p>
          )}
        </div>
        
        {/* Bank Details */}
        <div className="mb-4">
          <label htmlFor="bank_details" className="block text-sm font-medium text-gray-700 mb-1">
            Bank Details *
          </label>
          <textarea
            id="bank_details"
            name="bank_details"
            value={formData.bank_details}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.bank_details ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter bank details"
            rows="3"
          />
          {errors.bank_details && (
            <p className="mt-1 text-sm text-red-600">{errors.bank_details}</p>
          )}
        </div>

        {/* Solus2 Tag ID */}
        <div className="mb-4">
          <label htmlFor="solus2_tag_id" className="block text-sm font-medium text-gray-700 mb-1">
            Solus2 Tag ID
          </label>
          <input
            type="text"
            id="solus2_tag_id"
            name="solus2_tag_id"
            value={formData.solus2_tag_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter Solus2 tag ID"
          />
        </div>

        {/* Broker ID */}
        <div className="mb-4">
          <label htmlFor="broker_id" className="block text-sm font-medium text-gray-700 mb-1">
            Broker ID
          </label>
          <input
            type="text"
            id="broker_id"
            name="broker_id"
            value={formData.broker_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter broker ID"
          />
        </div>

        {/* Acronis Brand */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              id="acronis_brand"
              name="acronis_brand"
              checked={formData.acronis_brand}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Acronis Brand</span>
          </label>
        </div>

        {/* Support Name */}
        <div className="mb-4">
          <label htmlFor="support_name" className="block text-sm font-medium text-gray-700 mb-1">
            Support Name
          </label>
          <input
            type="text"
            id="support_name"
            name="support_name"
            value={formData.support_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter support name"
          />
        </div>

        {/* Support Email */}
        <div className="mb-4">
          <label htmlFor="support_email" className="block text-sm font-medium text-gray-700 mb-1">
            Support Email
          </label>
          <input
            type="email"
            id="support_email"
            name="support_email"
            value={formData.support_email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.support_email ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter support email"
          />
          {errors.support_email && (
            <p className="mt-1 text-sm text-red-600">{errors.support_email}</p>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : brand ? 'Update Brand' : 'Add Brand'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
