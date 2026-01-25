import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { db } from '../../db/db';
import type { Payment, Customer } from '../../db/db';

export const PaymentPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CHECK' | 'BANK'>('CASH');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allCustomers = await db.customers.toArray();
    const allPayments = await db.payments.toArray();
    setCustomers(allCustomers);
    setPayments(allPayments);
  };

  const handleAddPayment = async () => {
    if (!selectedCustomerId || paymentAmount <= 0) {
      alert('Please select customer and enter amount');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const newBalance = Math.max(0, customer.khataBalance - paymentAmount);

    await db.payments.add({
      customerId: selectedCustomerId,
      amount: paymentAmount,
      timestamp: Date.now(),
      type: newBalance === 0 ? 'FULL' : 'PARTIAL',
      paymentMethod,
    });

    await db.customers.update(selectedCustomerId, {
      khataBalance: newBalance,
    });

    setPaymentAmount(0);
    setSelectedCustomerId(null);
    setShowForm(false);
    loadData();
  };

  const outstandingCustomers = customers.filter(c => c.khataBalance > 0);
  const totalOutstanding = outstandingCustomers.reduce((sum, c) => sum + c.khataBalance, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Payments</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-green text-white p-3 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add
        </button>
      </div>

      <div className="bg-warning-orange text-white p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle size={24} className="flex-shrink-0" />
          <div>
            <div className="font-bold">{outstandingCustomers.length} Customers Owe Money</div>
            <div className="text-lg font-semibold">Total Outstanding: ₹{totalOutstanding}</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg p-2"
          >
            <option value="">Select Customer</option>
            {outstandingCustomers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} - Balance: ₹{c.khataBalance}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Payment amount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="w-full border border-gray-300 rounded-lg p-2"
          >
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CHECK">Check</option>
            <option value="BANK">Bank Transfer</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAddPayment}
              className="flex-1 bg-primary-green text-white p-2 rounded-lg"
            >
              Save Payment
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setPaymentAmount(0);
                setSelectedCustomerId(null);
              }}
              className="flex-1 bg-gray-300 text-gray-700 p-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-gray-800">Outstanding Balances</h3>
        {outstandingCustomers.map(customer => (
          <div key={customer.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-gray-800">{customer.name}</div>
                <div className="text-sm text-gray-500">{customer.phone}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-danger-red">₹{customer.khataBalance}</div>
                <div className="text-xs text-gray-500">
                  Due Since: {new Date(customer.lastVisit || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {payments.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800">Recent Payments</h3>
          {payments.slice(-10).reverse().map(payment => {
            const customer = customers.find(c => c.id === payment.customerId);
            return (
              <div key={payment.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
                <CheckCircle size={20} className="text-primary-green flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{customer?.name}</div>
                  <div className="text-xs text-gray-500">
                    {payment.type} - {payment.paymentMethod}
                  </div>
                </div>
                <div className="text-lg font-bold text-primary-green">+₹{payment.amount}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
