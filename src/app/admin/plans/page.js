"use client";
import React, { useState, useEffect } from "react";
import AdminApiService from "@/services/adminApiService";
import { useAuth } from "@/components/providers/AuthProvider";
import Table from "@/components/table/Table";
import TableToolbar from "@/components/table/TableToolbar";
import PlanModal from "@/components/plan/PlanModal";

export default function PlansPage() {
  const { token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminApiService.getPlans(token);
      
      setPlans(data?.data || []);
    } catch (e) {
      console.error("Error fetching plans:", e);
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    
    if (token) fetchPlans();
  }, [token]);

  const handleAdd = () => {
    setEditPlan(null);
    setModalOpen(true);
  };

  const handleEdit = (plan) => {
    setEditPlan(plan);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await AdminApiService.deletePlan(token, id);
      fetchPlans();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleModalClose = (refresh = false) => {
    setModalOpen(false);
    setEditPlan(null);
    if (refresh) fetchPlans();
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Name", accessor: "name" },
    { header: "Type", accessor: "type" },
    { header: "CPU Count", accessor: "cpu_count" },
    { header: "CPU Type", accessor: "cpu_type" },
    { header: "Memory (MB)", accessor: "memory_size" },
    { header: "Disk (GB)", accessor: "disk_size" },
    { header: "SolusVM ID", accessor: "solusvm_id" },
    { header: "Solus2 ID", accessor: "solus2_id" },
    { header: "OpenStack ID", accessor: "openstack_id" },
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
      <TableToolbar title="Plans" addNew={{ onClick: handleAdd, label: "Add Plan" }} />
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <Table columns={columns} data={plans} loading={loading} />
      {modalOpen && (
        <PlanModal
          open={modalOpen}
          onClose={handleModalClose}
          plan={editPlan}
          token={token}
        />
      )}
    </div>
  );
}
