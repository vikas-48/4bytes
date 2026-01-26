import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, User, X, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { db } from '../../db/db';
import type { Customer, Transaction } from '../../db/db';

export const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  // History / Details View State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);

  // Settle Khata State
  const [showSettleInput, setShowSettleInput] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const allCustomers = await db.customers.toArray();
    setCustomers(allCustomers);
  };

  const loadHistory = async (customerId: number) => {
    const txs = await db.transactions
      .where('customerId')
      .equals(customerId)
      .reverse()
      .sortBy('timestamp');
    setHistory(txs);
  };

  const handleSettleKhata = async () => {
    if (!selectedCustomer || !settleAmount || Number(settleAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amount = Number(settleAmount);

    try {
      await db.transaction('rw', db.customers, db.transactions, async () => {
        // 1. Add Payment Transaction
        await db.transactions.add({
          timestamp: Date.now(),
          type: 'PAYMENT', // Using 'PAYMENT' type for settlement
          amount: amount,
          items: [], // No items for settlement
          customerId: selectedCustomer.id,
          paymentMethod: 'CASH', // Assuming cash settlement for simplicity
        });

        // 2. Update Customer Balance & Trust
        const newBalance = (selectedCustomer.khataBalance || 0) - amount;
        const newTrust = Math.min(100, (selectedCustomer.trustScore ?? 0) + 2); // +2 Bonus for settling

        await db.customers.update(selectedCustomer.id!, {
          khataBalance: newBalance,
          trustScore: newTrust,
          lastVisit: Date.now()
        });
      });

      alert('Khata Settled Successfully!');
      setSettleAmount('');
      setShowSettleInput(false);

      // Refresh Data
      const updatedCustomer = await db.customers.get(selectedCustomer.id!);
      if (updatedCustomer) {
        setSelectedCustomer(updatedCustomer);
        loadHistory(updatedCustomer.id!);
        loadCustomers(); // Helper to refresh list view
      }
    } catch (e) {
      console.error(e);
      alert('Settlement Failed');
    }
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
    <div className="space-y-4 dark:text-gray-100">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Customers</h2>
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
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-3">
          <input
            type="text"
            placeholder="Customer name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white"
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
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 p-2 rounded-lg"
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
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 pl-10 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="space-y-2">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            onClick={() => { setSelectedCustomer(customer); loadHistory(customer.id!); setShowSettleInput(false); setSettleAmount(''); }}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 active:scale-98 transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-white">
                  <User size={18} />
                  {customer.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone size={16} />
                  {customer.phone}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-primary-green">
                  Balance: ₹{customer.khataBalance}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Trust: {customer.trustScore || 0}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Details & History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg h-[80vh] sm:h-auto sm:max-h-[80vh] rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50 dark:bg-gray-900/50">
              <div>
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  {selectedCustomer.name}
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    Score: {selectedCustomer.trustScore || 0}
                  </span>
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-900/50 relative overflow-hidden">
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider mb-1">Due Balance</div>
                  <div className="text-2xl font-black text-orange-600 dark:text-orange-500">₹{selectedCustomer.khataBalance}</div>
                  {/* Settle Button */}
                  {selectedCustomer.khataBalance > 0 && (
                    <button
                      onClick={() => setShowSettleInput(!showSettleInput)}
                      className="absolute bottom-2 right-2 bg-orange-600 text-white text-xs px-2 py-1.5 rounded-lg active:scale-95 transition"
                    >
                      {showSettleInput ? 'Cancel' : 'Settle'}
                    </button>
                  )}
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Visits</div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-500">{selectedCustomer.visitValidation || 0}</div>
                </div>
              </div>

              {/* Settle Input Area */}
              {showSettleInput && (
                <div className="mb-6 p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-2xl animate-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">Enter Settlement Amount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value)}
                      placeholder={`Max: ${selectedCustomer.khataBalance}`}
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl p-2.5 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      onClick={handleSettleKhata}
                      className="bg-primary-green text-white px-4 rounded-xl font-bold active:scale-95 transition"
                    >
                      Pay
                    </button>
                  </div>
                </div>
              )}

              <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <Clock size={16} /> Transaction History
              </h4>

              {history.length === 0 ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-600 italic">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(tx => (
                    <div key={tx.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'PAYMENT'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                          : (tx.paymentMethod === 'KHATA' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400')
                          }`}>
                          {tx.type === 'PAYMENT' ? <ArrowDownLeft size={20} /> : (tx.paymentMethod === 'KHATA' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-sm">
                            {tx.type === 'PAYMENT' ? 'KHATA PAYMENT' : `${tx.paymentMethod} SALE`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold ${tx.type === 'PAYMENT' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                        {tx.type === 'PAYMENT' ? '-' : ''}₹{tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
