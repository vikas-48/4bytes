import React, { useState, useEffect } from 'react';
import { customerApi } from '../../services/api';
import { Plus, User, Phone, X, Save } from 'lucide-react';
import type { Customer } from '../../services/api';

export const KhataPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phoneNumber: '' });

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

    const handleAddCustomer = async () => {
        if (!newCustomer.name || !newCustomer.phoneNumber) return;
        try {
            await customerApi.create(newCustomer);
            setIsAdding(false);
            setNewCustomer({ name: '', phoneNumber: '' });
            loadCustomers();
        } catch (err) {
            console.error('Failed to save customer', err);
        }
    };

    return (
        <div className="p-4 safe-area-bottom">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Khata Ledger</h2>
                <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                    {customers.length} Accounts Active
                </span>
            </div>

            {isAdding ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up border border-orange-100">
                    <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-bold">New Account</h3>
                        <button onClick={() => setIsAdding(false)}><X size={24} className="text-gray-400" /></button>
                    </div>
                    <div className="space-y-4">
                        <input
                            type="text"
                            className="w-full p-3 bg-gray-50 rounded-xl"
                            placeholder="Customer Name"
                            value={newCustomer.name}
                            onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        />
                        <input
                            type="tel"
                            className="w-full p-3 bg-gray-50 rounded-xl"
                            placeholder="Phone Number"
                            value={newCustomer.phoneNumber}
                            onChange={e => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
                        />
                        <button onClick={handleAddCustomer} className="w-full bg-orange-500 text-white p-4 rounded-xl font-bold">
                            <Save size={20} /> Register Account
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <button onClick={() => setIsAdding(true)} className="w-full bg-white border-2 border-dashed border-orange-400 text-orange-500 p-4 rounded-xl font-bold transition-colors mb-6">
                        <Plus size={24} /> Create New Account
                    </button>
                    <div className="space-y-3 pb-20">
                        {customers.map(customer => (
                            <div key={customer._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><User size={24} /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{customer.name || 'Anonymous'}</h4>
                                        <div className="flex items-center gap-1 text-xs text-gray-500"><Phone size={12} /> {customer.phoneNumber}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 mb-1">Dues</div>
                                    <div className={`font-black text-lg ${(customer.khataBalance || 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>₹{customer.khataBalance || 0}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
