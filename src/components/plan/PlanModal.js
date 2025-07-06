import React, { useState } from 'react';
import AdminApiService from '@/services/adminApiService';

export default function PlanModal({ open, onClose, plan, token }) {
  const isEdit = !!plan;
  const [form, setForm] = useState({
    name: plan?.name || '',
    solusvm_id: plan?.solusvm_id || '',
    solus2_id: plan?.solus2_id || '',
    openstack_id: plan?.openstack_id || '',
    type: plan?.type || 'virtual',
    cpu_count: plan?.cpu_count || '',
    cpu_type: plan?.cpu_type || '',
    memory_size: plan?.memory_size || '',
    disk_size: plan?.disk_size || '',
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    // Validate required fields
    if (!form.name || !form.type || !form.cpu_count || !form.cpu_type || !form.memory_size || !form.disk_size) {
      setError('Name, Type, CPU Count, CPU Type, Memory Size, and Disk Size are required.');
      setSaving(false);
      return;
    }
    
    try {
      if (isEdit) {
        await AdminApiService.updatePlan(token, plan.id, form);
      } else {
        await AdminApiService.createPlan(token, form);
      }
      onClose(true);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{isEdit ? 'Edit' : 'Add'} Plan</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block mb-1">Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border px-2 py-1 rounded" required />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Type *</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full border px-2 py-1 rounded" required>
              <option value="virtual">Virtual</option>
              <option value="dedicated">Dedicated</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="block mb-1">CPU Count *</label>
            <input 
              name="cpu_count" 
              value={form.cpu_count} 
              onChange={handleChange} 
              className="w-full border px-2 py-1 rounded" 
              type="number" 
              min="1" 
              required 
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">CPU Type *</label>
            <input name="cpu_type" value={form.cpu_type} onChange={handleChange} className="w-full border px-2 py-1 rounded" required />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Memory Size (MB) *</label>
            <input 
              name="memory_size" 
              value={form.memory_size} 
              onChange={handleChange} 
              className="w-full border px-2 py-1 rounded" 
              type="number" 
              min="1" 
              required 
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Disk Size (GB) *</label>
            <input 
              name="disk_size" 
              value={form.disk_size} 
              onChange={handleChange} 
              className="w-full border px-2 py-1 rounded" 
              type="number" 
              min="1" 
              required 
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">SolusVM ID</label>
            <input name="solusvm_id" value={form.solusvm_id} onChange={handleChange} className="w-full border px-2 py-1 rounded" />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Solus2 ID</label>
            <input name="solus2_id" value={form.solus2_id} onChange={handleChange} className="w-full border px-2 py-1 rounded" />
          </div>
          <div className="mb-4">
            <label className="block mb-1">OpenStack ID</label>
            <input name="openstack_id" value={form.openstack_id} onChange={handleChange} className="w-full border px-2 py-1 rounded" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => onClose(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={saving}>{saving ? 'Saving...' : (isEdit ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
