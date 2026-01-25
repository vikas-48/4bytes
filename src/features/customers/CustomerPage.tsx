import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, User } from 'lucide-react';
import { db } from '../../db/db';
import type { Customer } from '../../db/db';

export const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const allCustomers = await db.customers.toArray();
    setCustomers(allCustomers);
  };

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.phone) {
      alert('Please fill all fields');
      return;
    }

    if (editingId) {
      await db.customers.update(editingId, {
        ...formData,
        khataBalance: customers.find(c => c.id === editingId)?.khataBalance || 0,
      });
    } else {
      await db.customers.add({
        name: formData.name,
        phone: formData.phone,
        khataBalance: 0,
        trustScore: 0,
        visitValidation: 0,
        loyaltyPoints: 0,
        totalPurchases: 0,
        createdAt: Date.now(),
      });
    }

    setFormData({ name: '', phone: '' });
    setEditingId(null);
    setShowForm(false);
    loadCustomers();
  };

  const filteredCustomers = customers.filter(
    c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', phone: '' });
          }}
          className="bg-primary-green text-white p-3 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
          <input
            type="text"
            placeholder="Customer name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCustomer}
              className="flex-1 bg-primary-green text-white p-2 rounded-lg"
            >
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ name: '', phone: '' });
              }}
              className="flex-1 bg-gray-300 text-gray-700 p-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 pl-10"
        />
      </div>

      <div className="space-y-2">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-gray-800">
                  <User size={18} />
                  {customer.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={16} />
                  {customer.phone}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-primary-green">
                  Balance: ₹{customer.khataBalance}
                </div>
                <div className="text-xs text-gray-500">
                  Points: {customer.loyaltyPoints}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
