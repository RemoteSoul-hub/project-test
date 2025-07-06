"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Added for navigation
import AdminApiService from "@/services/adminApiService";
import { useAuth } from "@/components/providers/AuthProvider";
import Table from "@/components/table/Table";
import TableToolbar from "@/components/table/TableToolbar";
// EmailTemplateModal is no longer used for editing here, can be removed if not used elsewhere.

export default function EmailTemplatesPage() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [modalOpen, setModalOpen] = useState(false); // Modal state no longer needed for edit
  // const [selectedTemplate, setSelectedTemplate] = useState(null); // Modal state no longer needed for edit
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter(); // Initialize router

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminApiService.getEmailTemplates(token);
      
      setTemplates(data?.data || []);
      setFilteredTemplates(data?.data || []);
    } catch (e) {
      console.error("Error fetching email templates:", e);
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchTemplates();
  }, [token]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTemplates(templates);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = templates.filter(
        template => 
          template.name.toLowerCase().includes(term) || 
          template.subject.toLowerCase().includes(term)
      );
      setFilteredTemplates(filtered);
    }
  }, [searchTerm, templates]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleEdit = (template) => {
    router.push(`/admin/email-templates/edit/${template.id}`);
  };

  // handleModalClose is no longer needed if modal is fully removed for edit
  // const handleModalClose = (refresh = false) => {
  //   setModalOpen(false);
  //   setSelectedTemplate(null);
  //   if (refresh) fetchTemplates();
  // };

  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    
    setDeleteLoading(true);
    try {
      await AdminApiService.deleteEmailTemplate(token, templateToDelete.id);
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
      // Refresh the templates list
      fetchTemplates();
    } catch (e) {
      console.error("Error deleting template:", e);
      setError(`Failed to delete template: ${e.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setTemplateToDelete(null);
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Name", accessor: "name" },
    { header: "Subject", accessor: "subject" },
    { header: "Language", accessor: "language" },
    { 
      header: "Is Active", 
      accessor: "is_active",
      cell: (value) => (value === 1 || value === true ? "Yes" : "No")
    },
    { 
      header: "Is Editable", 
      accessor: "is_editable",
      cell: (value) => (value === 1 || value === true ? "Yes" : "No")
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (value, row) => (
        <div className="flex gap-2 justify-center">
          <button 
            className="px-2 py-1 bg-blue-600 text-white rounded" 
            onClick={() => handleEdit(row)}
          >
            Edit
          </button>
          {row.is_editable !== false && (
            <button 
              className="px-2 py-1 bg-red-600 text-white rounded" 
              onClick={() => handleDeleteClick(row)}
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 md:p-6">
      <TableToolbar 
        title="Email Templates" 
        onSearch={handleSearch}
        addNew={{
          onClick: () => {
            router.push('/admin/email-templates/add'); // Navigate to the new page
          },
          label: 'Create Template'
        }}
      />
      
      {error && <div className="text-red-600 mb-4">{error}</div>}
      
      <Table 
        columns={columns} 
        data={filteredTemplates} 
        loading={loading}
      />
      
      {/* Modal is no longer used for editing. 
          If EmailTemplateModal was solely for editing, it can be removed entirely.
          Keeping the delete confirmation dialog as it's separate. 
      */}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && templateToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Delete Email Template</h2>
            <p className="mb-6">
              Are you sure you want to delete the template "{templateToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-200 rounded"
                onClick={handleDeleteCancel}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="px-3 md:px-4 py-1.5 md:py-2 bg-red-600 text-white rounded"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
