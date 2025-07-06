'use client'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter, useParams } from 'next/navigation';
import AdminApiService from '@/services/adminApiService';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function AdminInvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id: invoiceId } = params;
  const { data: session, status } = useSession();
  console.log("Session status in AdminInvoiceDetailsPage:", status);
  console.log("Session data in AdminInvoiceDetailsPage:", session);
  const [invoice, setInvoice] = useState(null);
  const [editableInvoice, setEditableInvoice] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 0,
    amount: 0,
    start_date: '',
    end_date: '',
  });
  const [editingItemId, setEditingItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isItemSaving, setIsItemSaving] = useState(false);

  useEffect(() => {
    const token = session?.laravelApiToken;
    if (token && status === "authenticated" && invoiceId) {
      fetchInvoiceDetails(token, invoiceId);
      fetchInvoiceItems(token, invoiceId);
    } else if (status === "loading") {
      setLoading(true);
    } else if (status === "unauthenticated") {
      setLoading(false);
      setError("Authentication required.");
    }
  }, [session, status, invoiceId]);

  const fetchInvoiceDetails = async (token, id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminApiService.getInvoice(token, id);
      setInvoice(data.data);
      setEditableInvoice(data.data);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      setError(error.message || "Failed to fetch invoice details");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceItems = async (token, id) => {
    try {
      const data = await AdminApiService.getInvoiceItemsForInvoice(token, id);
      setInvoiceItems(data.data);
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      toast.error(`Failed to fetch invoice items: ${error.message || 'Unknown error'}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditableInvoice(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (name, value) => {
    setEditableInvoice(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!session?.laravelApiToken || !editableInvoice) return;

    try {
      setIsSaving(true);
      setError(null);
      const payload = {
        partner_id: editableInvoice.partner_id,
        start_date: editableInvoice.start_date,
        end_date: editableInvoice.end_date,
        is_paid: editableInvoice.is_paid,
        net_amount: editableInvoice.net_amount,
        paid_at: editableInvoice.paid_at,
        refunded: editableInvoice.refunded,
        sent_at: editableInvoice.sent_at,
        tax_amount: editableInvoice.tax_amount,
        total: editableInvoice.total,
        brand_name: editableInvoice.brand_name,
        brand_address: editableInvoice.brand_address,
        brand_billing_email: editableInvoice.brand_billing_email,
        brand_tax_rate: editableInvoice.brand_tax_rate,
        brand_bank_details: editableInvoice.brand_bank_details,
      };

      const updatedData = await AdminApiService.updateInvoice(session.laravelApiToken, invoiceId, payload);
      setInvoice(updatedData.data);
      setEditableInvoice(updatedData.data);
      toast.success('Invoice updated successfully!');
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError(err.message || "Failed to update invoice");
      toast.error(`Failed to update invoice: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewItemChange = (e) => {
    const { name, value, type } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleNewItemDateChange = (name, value) => {
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddItem = async () => {
    if (!session?.laravelApiToken) return;
    if (isNaN(parseInt(invoiceId))) {
      toast.error("Invalid Invoice ID. Cannot add item.");
      return;
    }
    try {
      setIsItemSaving(true);
      const payload = {
        invoice_id: parseInt(invoiceId),
        ...newItem,
      };
      console.log("Adding invoice item with payload:", payload); // Log the payload
      const addedItem = await AdminApiService.createInvoiceItem(session.laravelApiToken, payload);
      setInvoiceItems(prev => [...prev, addedItem.data]);
      setNewItem({
        description: '',
        quantity: 0,
        amount: 0,
        start_date: '',
        end_date: '',
      });
      toast.success('Invoice item added successfully!');
    } catch (err) {
      console.error('Error adding invoice item:', err);
      toast.error(`Failed to add invoice item: ${err.message || 'Unknown error'}`);
    } finally {
      setIsItemSaving(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setNewItem({ // Populate the new item form with the item being edited
      description: item.description,
      quantity: item.quantity,
      amount: item.amount,
      start_date: formatDateTimeLocal(item.start_date),
      end_date: formatDateTimeLocal(item.end_date),
    });
  };

  const handleUpdateItem = async (originalItem) => {
    if (!session?.laravelApiToken || !editingItemId) return;
    try {
      setIsItemSaving(true);
      const payload = {
        invoice_id: parseInt(invoiceId),
        ...newItem, // Use data from newItem state
      };
      const updatedItem = await AdminApiService.updateInvoiceItem(session.laravelApiToken, editingItemId, payload);
      setInvoiceItems(prev => prev.map(item => item.id === editingItemId ? updatedItem.data : item));
      setEditingItemId(null);
      setNewItem({
        description: '',
        quantity: 0,
        amount: 0,
        start_date: '',
        end_date: '',
      });
      toast.success('Invoice item updated successfully!');
    } catch (err) {
      console.error('Error updating invoice item:', err);
      toast.error(`Failed to update invoice item: ${err.message || 'Unknown error'}`);
    } finally {
      setIsItemSaving(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!session?.laravelApiToken) return;
    if (!window.confirm('Are you sure you want to delete this invoice item?')) return;

    try {
      setIsItemSaving(true);
      await AdminApiService.deleteInvoiceItem(session.laravelApiToken, itemId);
      setInvoiceItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Invoice item deleted successfully!');
    } catch (err) {
      console.error('Error deleting invoice item:', err);
      toast.error(`Failed to delete invoice item: ${err.message || 'Unknown error'}`);
    } finally {
      setIsItemSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Loading Invoice Details...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="my-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
          Error: {error}
        </div>
        <Link href="/admin/invoices" className="text-blue-600 hover:underline">
          &larr; Back to Invoices List
        </Link>
      </div>
    );
  }

  if (!invoice || !editableInvoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="my-4 p-4 bg-yellow-100 text-yellow-700 border border-yellow-400 rounded">
          Invoice not found.
        </div>
        <Link href="/admin/invoices" className="text-blue-600 hover:underline">
          &larr; Back to Invoices List
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Invoice Details: {invoice.id}</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Invoice'}
          </button>
          <Link href="/admin/invoices" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            &larr; Back to Invoices List
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Invoice Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Details about the invoice and associated brand.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Invoice ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{invoice.id}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Partner ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="number"
                  name="partner_id"
                  value={editableInvoice.partner_id || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formatDateTimeLocal(editableInvoice.start_date)}
                  onChange={(e) => handleDateChange('start_date', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formatDateTimeLocal(editableInvoice.end_date)}
                  onChange={(e) => handleDateChange('end_date', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Is Paid</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="checkbox"
                  name="is_paid"
                  checked={editableInvoice.is_paid || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Paid At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="datetime-local"
                  name="paid_at"
                  value={formatDateTimeLocal(editableInvoice.paid_at)}
                  onChange={(e) => handleDateChange('paid_at', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Sent At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="datetime-local"
                  name="sent_at"
                  value={formatDateTimeLocal(editableInvoice.sent_at)}
                  onChange={(e) => handleDateChange('sent_at', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Net Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="net_amount"
                  value={editableInvoice.net_amount || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tax Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="tax_amount"
                  value={editableInvoice.tax_amount || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="total"
                  value={editableInvoice.total || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Refunded</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="refunded"
                  value={editableInvoice.refunded || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Brand Information
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Brand Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="brand_name"
                  value={editableInvoice.brand_name || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Brand Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="brand_address"
                  value={editableInvoice.brand_address || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Brand Billing Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="email"
                  name="brand_billing_email"
                  value={editableInvoice.brand_billing_email || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Brand Tax Rate</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="brand_tax_rate"
                  value={editableInvoice.brand_tax_rate || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Brand Bank Details</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <textarea
                  name="brand_bank_details"
                  value={editableInvoice.brand_bank_details || ''}
                  onChange={handleInputChange}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                ></textarea>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Invoice Items
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {invoiceItems.length > 0 ? (
              invoiceItems.map((item) => (
                <li key={item.id} className="px-4 py-4 sm:px-6">
                  {editingItemId === item.id ? (
                    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-8">
                      <div className="sm:col-span-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="description"
                            id="description"
                            value={newItem.description}
                            onChange={handleNewItemChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                          Quantity
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="quantity"
                            id="quantity"
                            value={newItem.quantity}
                            onChange={handleNewItemChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                          Amount
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="amount"
                            id="amount"
                            step="0.01"
                            value={newItem.amount}
                            onChange={handleNewItemChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <label htmlFor="start_date_item" className="block text-sm font-medium text-gray-700">
                          Start Date
                        </label>
                        <div className="mt-1">
                          <input
                            type="datetime-local"
                            name="start_date"
                            id="start_date_item"
                            value={newItem.start_date}
                            onChange={(e) => handleNewItemDateChange('start_date', e.target.value)}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <label htmlFor="end_date_item" className="block text-sm font-medium text-gray-700">
                          End Date
                        </label>
                        <div className="mt-1">
                          <input
                            type="datetime-local"
                            name="end_date"
                            id="end_date_item"
                            value={newItem.end_date}
                            onChange={(e) => handleNewItemDateChange('end_date', e.target.value)}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-6 flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setEditingItemId(null);
                            setNewItem({ description: '', quantity: 0, amount: 0, start_date: '', end_date: '' });
                          }}
                          type="button"
                          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateItem(item)}
                          disabled={isItemSaving}
                          type="button"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isItemSaving ? 'Updating...' : 'Update Item'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.description}</p>
                        <div className="mt-1 text-sm text-gray-500">
                          Quantity: {item.quantity} | Amount: {item.amount}
                        </div>
                        <div className="text-sm text-gray-500">
                          Start: {formatDate(item.start_date)} | End: {formatDate(item.end_date)}
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditItem(item)}
                          type="button"
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={isItemSaving}
                          type="button"
                          className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">No items found for this invoice.</li>
            )}
          </ul>
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h4 className="text-md font-medium text-gray-900 mb-4">Add New Invoice Item</h4>
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-8">
              <div className="sm:col-span-6">
                <label htmlFor="new_description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="description"
                    id="new_description"
                    value={newItem.description}
                    onChange={handleNewItemChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="new_quantity" className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="quantity"
                    id="new_quantity"
                    value={newItem.quantity}
                    onChange={handleNewItemChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="new_amount" className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="amount"
                    id="new_amount"
                    step="0.01"
                    value={newItem.amount}
                    onChange={handleNewItemChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="new_start_date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    name="start_date"
                    id="new_start_date"
                    value={newItem.start_date}
                    onChange={(e) => handleNewItemDateChange('start_date', e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="new_end_date" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    name="end_date"
                    id="new_end_date"
                    value={newItem.end_date}
                    onChange={(e) => handleNewItemDateChange('end_date', e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="sm:col-span-6 flex justify-end">
                <button
                  onClick={handleAddItem}
                  disabled={isItemSaving}
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isItemSaving ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
