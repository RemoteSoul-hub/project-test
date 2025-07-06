import React, { useState, useEffect } from 'react';
import AdminApiService from '@/services/adminApiService';

export default function OsTemplateModal({ open, onClose, osTemplate, token }) {
  const isEdit = !!osTemplate;
  const [form, setForm] = useState({
    name: '',
    type: '',
    solusvm_id: '',
    solus2_id: '',
    openstack_id: '',
    is_ut: false,
    is_ut_dual_user: false,
    ut_admin_username: '',
    ut_regular_username: '',
    group_ids: [],
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize form with osTemplate data when available
  useEffect(() => {
    if (isEdit && osTemplate) {
      // Extract group IDs from the groups array if it exists
      const groupIds = osTemplate.groups 
        ? osTemplate.groups.map(group => group.id) 
        : osTemplate.group_ids || [];
      
      setForm({
        name: osTemplate.name || '',
        type: osTemplate.type || '',
        solusvm_id: osTemplate.solusvm_id || '',
        solus2_id: osTemplate.solus2_id || '',
        openstack_id: osTemplate.openstack_id || '',
        is_ut: osTemplate.is_ut || false,
        is_ut_dual_user: osTemplate.is_ut_dual_user || false,
        ut_admin_username: osTemplate.ut_admin_username || '',
        ut_regular_username: osTemplate.ut_regular_username || '',
        group_ids: groupIds,
      });
    } else {
      // Initialize with default values for new template
      setForm({
        name: '',
        type: '',
        solusvm_id: '',
        solus2_id: '',
        openstack_id: '',
        is_ut: false,
        is_ut_dual_user: false,
        ut_admin_username: '',
        ut_regular_username: '',
        group_ids: [],
      });
    }
  }, [isEdit, osTemplate]);

  // Fetch template groups
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const groupsData = await AdminApiService.getOsTemplateGroups(token);
        setGroups(groupsData?.data || []);
      } catch (e) {
        console.error("Error fetching template groups:", e);
        setError(e.message);
      }
      setLoading(false);
    };

    if (token && open) {
      fetchGroups();
    }
  }, [token, open]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleGroupChange = e => {
    const groupId = parseInt(e.target.value);
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setForm({ ...form, group_ids: [...form.group_ids, groupId] });
    } else {
      setForm({ ...form, group_ids: form.group_ids.filter(id => id !== groupId) });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    if (!form.name || !form.type) {
      setError('Name and Type are required.');
      setSaving(false);
      return;
    }

    try {
      if (isEdit) {
        await AdminApiService.updateOsTemplate(token, osTemplate.id, form);
      } else {
        await AdminApiService.createOsTemplate(token, form);
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
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{isEdit ? 'Edit' : 'Add'} OS Template</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="block mb-1">Name *</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                className="w-full border px-2 py-1 rounded" 
                required 
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Type *</label>
              <select 
                name="type" 
                value={form.type} 
                onChange={handleChange} 
                className="w-full border px-2 py-1 rounded" 
                required 
              >
                <option value="">Select Type</option>
                <option value="virtual">Virtual</option>
                <option value="dedicated">Dedicated</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block mb-1">SolusVM ID</label>
              <input 
                name="solusvm_id" 
                value={form.solusvm_id} 
                onChange={handleChange} 
                className="w-full border px-2 py-1 rounded" 
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Solus2 ID</label>
              <input 
                name="solus2_id" 
                value={form.solus2_id} 
                onChange={handleChange} 
                className="w-full border px-2 py-1 rounded" 
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">OpenStack ID</label>
              <input 
                name="openstack_id" 
                value={form.openstack_id} 
                onChange={handleChange} 
                className="w-full border px-2 py-1 rounded" 
              />
            </div>
            <div className="mb-2">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="is_ut" 
                  checked={form.is_ut} 
                  onChange={handleChange} 
                  className="mr-2" 
                />
                Is UT
              </label>
            </div>
            <div className="mb-2">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="is_ut_dual_user" 
                  checked={form.is_ut_dual_user} 
                  onChange={handleChange} 
                  className="mr-2" 
                />
                Is UT Dual User
              </label>
            </div>
            {form.is_ut && (
              <>
                <div className="mb-2">
                  <label className="block mb-1">UT Admin Username</label>
                  <input 
                    name="ut_admin_username" 
                    value={form.ut_admin_username} 
                    onChange={handleChange} 
                    className="w-full border px-2 py-1 rounded" 
                  />
                </div>
                {form.is_ut_dual_user && (
                  <div className="mb-2">
                    <label className="block mb-1">UT Regular Username</label>
                    <input 
                      name="ut_regular_username" 
                      value={form.ut_regular_username} 
                      onChange={handleChange} 
                      className="w-full border px-2 py-1 rounded" 
                    />
                  </div>
                )}
              </>
            )}
            
            {groups.length > 0 && (
              <div className="mb-4">
                <label className="block mb-1">Template Groups</label>
                <div className="max-h-40 overflow-y-auto border p-2 rounded">
                  {groups.map(group => (
                    <div key={group.id} className="mb-1">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          value={group.id} 
                          checked={form.group_ids.includes(group.id)} 
                          onChange={handleGroupChange} 
                          className="mr-2" 
                        />
                        {group.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
        )}
      </div>
    </div>
  );
}
