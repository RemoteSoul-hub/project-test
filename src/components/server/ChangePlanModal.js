'use client'
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import ServerService from '@/services/serverService';
import ApiService from '@/services/apiService';

/**
 * Change Plan Modal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when the modal is closed
 * @param {function} props.onConfirm - Function to call when plan change is confirmed
 * @param {Object} props.server - Server object containing information about the server
 */
export default function ChangePlanModal({ isOpen, onClose, onConfirm, server }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available plans when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use ApiService to fetch plans
      const response = await ApiService.get('/plans');
      setPlans(response.data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load available plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedPlan) {
      setError('Please select a plan');
      return;
    }
    onConfirm(selectedPlan);
  };

  if (!server) return null;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Server Plan"
      size="md"
    >
      <div className="flex flex-col gap-4">
        <p className="text-gray-700">
          Select a new plan for your server. This action may require a server reboot.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="font-medium text-gray-900">Current Server: {server.label}</p>
          {server.plan && (
            <p className="text-gray-500">Current Plan: {server.plan.name}</p>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mt-2">
          <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
            Select New Plan
          </label>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : plans.length > 0 ? (
            <select
              id="plan"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - CPU: {plan.cpu_count}, RAM: {plan.memory_size}MB, Disk: {plan.disk_size}GB
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-500">No plans available</p>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPlan || loading}
            className={`px-4 py-2 rounded-md ${
              !selectedPlan || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Change Plan
          </button>
        </div>
      </div>
    </Modal>
  );
}
