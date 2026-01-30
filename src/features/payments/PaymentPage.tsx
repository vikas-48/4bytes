import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { ledgerApi, customerApi } from '../../services/api';

export const PaymentPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await customerApi.getAll();
      setCustomers(response.data);
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedCustomerId || paymentAmount <= 0) {
      alert('Please select customer and enter amount');
      return;
    }

    try {
      await ledgerApi.recordPayment({
        customerId: selectedCustomerId,
        amount: paymentAmount,
        paymentMode: 'cash'
      });
      setPaymentAmount(0);
      setSelectedCustomerId('');
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Payment failed', err);
    }
  };

  const outstandingCustomers = customers.filter(c => c.khataBalance > 0);
  const totalOutstanding = outstandingCustomers.reduce((sum, c) => sum + c.khataBalance, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary-green text-white p-3 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Add Payment
        </button>
      </div>

      <div className="bg-orange-500 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-start gap-2">
          <AlertCircle size={24} className="flex-shrink-0" />
          <div>
            <div className="font-bold">{outstandingCustomers.length} Dues Pending</div>
            <div className="text-2xl font-black">₹{totalOutstanding.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-xl shadow-xl space-y-3">
          <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3">
            <option value="">Select Account</option>
            {outstandingCustomers.map(c => (
              <option key={c._id} value={c._id}>{c.name || '+91 ' + c.phoneNumber} (₹{c.khataBalance})</option>
            ))}
          </select>
          <input type="number" placeholder="Payment amount" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} className="w-full border-2 border-gray-100 rounded-xl p-3 text-2xl font-black" />
          <button onClick={handleAddPayment} className="w-full bg-primary-green text-white p-4 rounded-xl font-bold text-lg shadow-lg">Confirm Payment</button>
          <button onClick={() => setShowForm(false)} className="w-full text-gray-400">Cancel</button>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-bold text-gray-800">Outstanding Balances</h3>
        {outstandingCustomers.map(customer => (
          <div key={customer._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <div className="font-bold">{customer.name || 'Anonymous'}</div>
              <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-red-500">₹{customer.khataBalance}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
