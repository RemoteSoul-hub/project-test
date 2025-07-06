"use client";
import React, { useState, useEffect } from "react";
import AdminApiService from "@/services/adminApiService";
import { useAuth } from "@/components/providers/AuthProvider";
import Table from "@/components/table/Table";
import TableToolbar from "@/components/table/TableToolbar";
import OsTemplateModal from "@/components/os-template/OsTemplateModal";

export default function OsTemplatesPage() {
  const { token } = useAuth();
  const [osTemplates, setOsTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOsTemplate, setEditOsTemplate] = useState(null);

  const fetchOsTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminApiService.getOsTemplates(token);
      
      setOsTemplates(data?.data || []);
    } catch (e) {
      console.error("Error fetching OS templates:", e);
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchOsTemplates();
  }, [token]);

  const handleAdd = () => {
    setEditOsTemplate(null);
    setModalOpen(true);
  };

  const handleEdit = async (osTemplate) => {
    try {
      // Fetch the complete template data before opening the modal
      const data = await AdminApiService.getOsTemplate(token, osTemplate.id);
      setEditOsTemplate(data?.data || osTemplate);
      setModalOpen(true);
    } catch (e) {
      console.error("Error fetching OS template details:", e);
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this OS template?")) return;
    try {
      await AdminApiService.deleteOsTemplate(token, id);
      fetchOsTemplates();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleModalClose = (refresh = false) => {
    setModalOpen(false);
    setEditOsTemplate(null);
    if (refresh) fetchOsTemplates();
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Name", accessor: "name" },
    { header: "Type", accessor: "type" },
    { header: "SolusVM ID", accessor: "solusvm_id" },
    { header: "Solus2 ID", accessor: "solus2_id" },
    { header: "OpenStack ID", accessor: "openstack_id" },
    { 
      header: "Is UT", 
      accessor: "is_ut",
      cell: (value) => (value ? "Yes" : "No")
    },
    { 
      header: "Is UT Dual User", 
      accessor: "is_ut_dual_user",
      cell: (value) => (value ? "Yes" : "No")
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (value, row) => (
        <div className="flex gap-2">
          <button className="px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => handleEdit(row)}>
            Edit
          </button>
          <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => handleDelete(row.id)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <TableToolbar title="OS Templates" addNew={{ onClick: handleAdd, label: "Add OS Template" }} />
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <Table columns={columns} data={osTemplates} loading={loading} />
      {modalOpen && (
        <OsTemplateModal
          open={modalOpen}
          onClose={handleModalClose}
          osTemplate={editOsTemplate}
          token={token}
        />
      )}
    </div>
  );
}
