import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/Modal';
import AdminApiService from '@/services/adminApiService';

const InvoiceCreateModal = ({ isOpen, onClose }) => {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [total, setTotal] = useState('');
  const [brandName, setBrandName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        if (status !== 'authenticated') return;
        const token = session?.laravelApiToken;
        const data = await AdminApiService.getUsers(token, { 'filter[role]': 'partners' });
        setPartners(data.data);
      } catch (error) {
        setError(error.message || 'Failed to fetch partners');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchPartners();
    }
  }, [session, status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = session?.laravelApiToken;
      const invoiceData = {
        partner_id: selectedPartner,
        net_amount: netAmount,
        total: total,
        brand_name: brandName,
        start_date: startDate,
        end_date: endDate,
        is_paid: isPaid,
      };
      await AdminApiService.createInvoice(token, invoiceData);
      onClose(); // Close the modal after successful creation
    } catch (error) {
      setError(error.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Invoice">
      {error && <div className="text-red-500">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="partner" className="block text-sm font-medium text-gray-700">
            Partner
          </label>
          <select
            id="partner"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a partner</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name}
              </option>
            ))}
          </select>
          {loading && <div className="text-gray-500">Loading partners...</div>}
        </div>
        <div>
          <label htmlFor="net_amount" className="block text-sm font-medium text-gray-700">
            Net Amount
          </label>
          <input
            type="number"
            id="net_amount"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={netAmount}
            onChange={(e) => setNetAmount(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="total" className="block text-sm font-medium text-gray-700">
            Total
          </label>
          <input
            type="number"
            id="total"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="brand_name" className="block text-sm font-medium text-gray-700">
            Brand Name
          </label>
          <input
            type="text"
            id="brand_name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="end_date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="is_paid" className="block text-sm font-medium text-gray-700">
            Is Paid
          </label>
          <input
            type="checkbox"
            id="is_paid"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={isPaid}
            onChange={(e) => setIsPaid(e.target.checked)}
            disabled={loading}
          />
        </div>
        <div>
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            Create Invoice
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InvoiceCreateModal;