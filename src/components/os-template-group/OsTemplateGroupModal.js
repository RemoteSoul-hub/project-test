import React, { useState } from 'react';
import AdminApiService from '@/services/adminApiService';

export default function OsTemplateGroupModal({ open, onClose, group, token }) {
  const isEdit = !!group;
  const [form, setForm] = useState({
    name: group?.name || '',
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
    
    if (!form.name) {
      setError('Name is required.');
      setSaving(false);
      return;
    }

    try {
      if (isEdit) {
        await AdminApiService.updateOsTemplateGroup(token, group.id, form);
      } else {
        await AdminApiService.createOsTemplateGroup(token, form);
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
        <h2 className="text-xl font-bold mb-4">{isEdit ? 'Edit' : 'Add'} OS Template Group</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">Name *</label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              className="w-full border px-2 py-1 rounded" 
              required 
            />
          </div>
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              className="px-4 py-2 bg-gray-300 rounded" 
              onClick={() => onClose(false)} 
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded" 
              disabled={saving}
            >
              {saving ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
