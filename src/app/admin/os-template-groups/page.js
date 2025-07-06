"use client";
import React, { useState, useEffect } from "react";
import AdminApiService from "@/services/adminApiService";
import { useAuth } from "@/components/providers/AuthProvider";
import Table from "@/components/table/Table";
import TableToolbar from "@/components/table/TableToolbar";
import OsTemplateGroupModal from "@/components/os-template-group/OsTemplateGroupModal";

export default function OsTemplateGroupsPage() {
  const { token } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminApiService.getOsTemplateGroups(token);
      
      setGroups(data?.data || []);
    } catch (e) {
      console.error("Error fetching OS template groups:", e);
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchGroups();
  }, [token]);

  const handleAdd = () => {
    setEditGroup(null);
    setModalOpen(true);
  };

  const handleEdit = async (group) => {
    try {
      // Fetch the complete group data before opening the modal
      const data = await AdminApiService.getOsTemplateGroup(token, group.id);
      setEditGroup(data?.data || group);
      setModalOpen(true);
    } catch (e) {
      console.error("Error fetching OS template group details:", e);
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this OS template group?")) return;
    try {
      await AdminApiService.deleteOsTemplateGroup(token, id);
      fetchGroups();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleModalClose = (refresh = false) => {
    setModalOpen(false);
    setEditGroup(null);
    if (refresh) fetchGroups();
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Name", accessor: "name" },
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
      <TableToolbar title="OS Template Groups" addNew={{ onClick: handleAdd, label: "Add OS Template Group" }} />
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <Table columns={columns} data={groups} loading={loading} />
      {modalOpen && (
        <OsTemplateGroupModal
          open={modalOpen}
          onClose={handleModalClose}
          group={editGroup}
          token={token}
        />
      )}
    </div>
  );
}
