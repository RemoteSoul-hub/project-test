"use client";
import React, { useState, useEffect } from "react";
import AdminApiService from "@/services/adminApiService";
import { useAuth } from "@/components/providers/AuthProvider";
import Table from "@/components/table/Table";
import TableToolbar from "@/components/table/TableToolbar";
import LocationModal from "@/components/location/LocationModal";

export default function LocationsPage() {
  const { token } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLocation, setEditLocation] = useState(null);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminApiService.getLocations(token);
      
      setLocations(data?.data || []);
    } catch (e) {
      console.error("Error fetching locations:", e);
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    
    if (token) fetchLocations();
  }, [token]);

  const handleAdd = () => {
    setEditLocation(null);
    setModalOpen(true);
  };

  const handleEdit = (location) => {
    setEditLocation(location);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this location?")) return;
    try {
      await AdminApiService.deleteLocation(token, id);
      fetchLocations();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleModalClose = (refresh = false) => {
    setModalOpen(false);
    setEditLocation(null);
    if (refresh) fetchLocations();
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Name", accessor: "name" },
    { header: "Country Code", accessor: "country_code" },
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
      <TableToolbar title="Locations" addNew={{ onClick: handleAdd, label: "Add Location" }} />
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <Table columns={columns} data={locations} loading={loading} />
      {modalOpen && (
        <LocationModal
          open={modalOpen}
          onClose={handleModalClose}
          location={editLocation}
          token={token}
        />
      )}
    </div>
  );
}
