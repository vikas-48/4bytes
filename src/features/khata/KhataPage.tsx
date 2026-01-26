import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Plus, User, Phone, X, Save, TrendingUp, AlertTriangle } from 'lucide-react';

export const KhataPage: React.FC = () => {
    const customers = useLiveQuery(() => db.customers.toArray());
    const [isAdding, setIsAdding] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

    const handleAddCustomer = async () => {
        if (!newCustomer.name) return;
        await db.customers.add({
            name: newCustomer.name,
            phone: newCustomer.phone,
            khataBalance: 0,
            trustScore: 100, // Default high trust
            visitValidation: 0,
            loyaltyPoints: 0,
            totalPurchases: 0,
            createdAt: Date.now(),
        });
        setIsAdding(false);
        setNewCustomer({ name: '', phone: '' });
    };

    // Simple Logic for Trust Score Visual
    // High Score (>80) = Green, Medium (50-80) = Yellow, Low (<50) = Red
    const getTrustColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 50) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    return (
        <div className="p-4 safe-area-bottom">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Khata / Udhaar</h2>
                <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                    {customers?.length || 0} Customers
                </span>
            </div>

            {isAdding ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up border border-orange-100">
                    <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-bold">New Customer</h3>
                        <button onClick={() => setIsAdding(false)}><X size={24} className="text-gray-400" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 text-lg"
                                value={newCustomer.name}
                                onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 text-lg"
                                value={newCustomer.phone}
                                onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={handleAddCustomer}
                            className="w-full bg-orange-500 text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mt-2 shadow-lg"
                        >
                            <Save size={20} />
                            Save Customer
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full bg-white border-2 border-dashed border-orange-400 text-orange-500 p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mb-6 hover:bg-orange-50 transition-colors"
                    >
                        <Plus size={24} />
                        Add Customer
                    </button>

                    <div className="space-y-3 pb-20">
                        {customers?.map(customer => {
                            const trustColor = getTrustColor(customer.trustScore);
                            return (
                                <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{customer.name}</h4>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Phone size={12} /> {customer.phone || 'No Phone'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm text-gray-500 mb-1">Balance</div>
                                        <div className={`font-black text-lg ${customer.khataBalance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            ₹{customer.khataBalance}
                                        </div>
                                        <div className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 font-bold ${trustColor}`}>
                                            {customer.trustScore >= 80 ? <TrendingUp size={10} /> : <AlertTriangle size={10} />}
                                            Trust: {customer.trustScore}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {customers?.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <p>No customers yet.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
