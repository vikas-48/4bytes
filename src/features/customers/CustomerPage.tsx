import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, User, Calendar, History, AlertCircle } from 'lucide-react';
import { customerApi } from '../../services/api';
import type { Customer } from '../../db/db';

export const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerApi.getAll();
      setCustomers(response.data);
    } catch (err) {
      console.error('Failed to load customers', err);
    }
  };

  const getLedgerStyles = (balance: number) => {
    if (balance <= 500) return {
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'bg-green-600',
      icon: '🟢'
    };
    if (balance <= 1500) return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-600',
      icon: '🟡'
    };
    return {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-600',
      icon: '🔴'
    };
  };

  const handleAddCustomer = async () => {
    if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
      alert('Valid 10-digit phone number is required');
      return;
    }

    try {
      await customerApi.create(formData);
      setFormData({ name: '', phoneNumber: '' });
      setEditingId(null);
      setShowForm(false);
      loadCustomers();
    } catch (err) {
      console.error('Failed to save customer', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No visits yet';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredCustomers = customers.filter(
    c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Customers (MongoDB)</h2>
          <p className="text-gray-500 text-sm">Centralized cloud ledger</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', phoneNumber: '' });
          }}
          className="bg-primary-green text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-primary-green/20 font-bold active:scale-95 transition-transform"
        >
          <Plus size={20} /> Add New
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phone Number (*)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-green rounded-xl p-3 pl-10 outline-none transition-all dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Customer Name (Optional)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-green rounded-xl p-3 pl-10 outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAddCustomer} className="flex-1 bg-primary-green text-white py-3 rounded-xl font-bold">Save Customer</button>
            <button onClick={() => setShowForm(false)} className="px-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold">Cancel</button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-gray-800 border-none rounded-2xl p-4 pl-12 shadow-sm outline-none focus:ring-2 focus:ring-primary-green/20 transition-all dark:text-white"
        />
      </div>

      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
            <User size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const styles = getLedgerStyles(customer.khataBalance);
            return (
              <div key={customer._id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all active:scale-[0.99]">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner ${styles.bg}`}>
                      {customer.name ? customer.name[0].toUpperCase() : <Phone size={24} className={styles.text} />}
                    </div>
                    <div>
                      <div className="font-black text-gray-900 dark:text-white text-lg flex items-center gap-2">
                        {customer.name || 'Anonymous Customer'}
                        {customer.khataBalance > 1500 && <AlertCircle size={16} className="text-red-500" />}
                      </div>
                      <div className="text-gray-500 font-medium flex items-center gap-1">
                        <Phone size={14} /> +91 {customer.phoneNumber}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-8">
                    <div className="text-center md:text-right order-2 md:order-1">
                      <div className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Ledge Balance</div>
                      <div className={`text-2xl font-black ${styles.text}`}>₹{customer.khataBalance} <span className="text-lg opacity-50">{styles.icon}</span></div>
                    </div>
                    <div className="flex flex-col gap-1 order-1 md:order-3 text-sm text-gray-500 font-bold">
                      <div className="flex items-center gap-2"><History size={14} className="text-primary-green" /><span>Activity Log</span></div>
                      <div className="flex items-center gap-2"><Calendar size={14} className="text-orange-400" /><span>{formatDate(customer.updatedAt)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
