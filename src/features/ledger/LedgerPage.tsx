import React, { useState, useEffect } from 'react';
import { billApi } from '../../services/api';
import { Receipt, Calendar, User, Phone, Tag } from 'lucide-react';

export const LedgerPage: React.FC = () => {
    const [bills, setBills] = useState<any[]>([]);
    const [filterMode, setFilterMode] = useState<'ALL' | 'cash' | 'online' | 'ledger'>('ALL');

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async () => {
        try {
            const response = await billApi.getAll();
            setBills(response.data);
        } catch (err) {
            console.error('Failed to load bills', err);
        }
    };

    const filteredEntries = filterMode === 'ALL'
        ? bills
        : bills.filter(e => e.paymentType === filterMode);

    const totalCash = bills
        .filter(e => e.paymentType === 'cash')
        .reduce((sum, e) => sum + e.totalAmount, 0);

    const totalUpi = bills
        .filter(e => e.paymentType === 'online')
        .reduce((sum, e) => sum + e.totalAmount, 0);

    const totalLedge = bills
        .filter(e => e.paymentType === 'ledger')
        .reduce((sum, e) => sum + e.totalAmount, 0);

    const totalRevenue = bills
        .filter(e => e.paymentType !== 'ledger')
        .reduce((sum, e) => sum + e.totalAmount, 0);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusStyles = (mode: string) => {
        switch (mode) {
            case 'cash': return 'bg-green-100 text-green-700 border-green-200';
            case 'online': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'ledger': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">Business Ledger (Cloud)</h2>
                    <p className="text-gray-500 text-sm">Centralized MongoDB auditing</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                    {(['ALL', 'cash', 'online', 'ledger'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setFilterMode(mode)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterMode === mode
                                ? 'bg-primary-green text-white shadow-lg shadow-primary-green/20'
                                : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700'
                                }`}
                        >
                            {mode.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold">REVENUE</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-2xl font-black text-orange-600">₹{totalLedge.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold">TOTAL PENDING KHATA</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100">
                    <div className="text-2xl font-black text-green-600">₹{totalCash.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold">CASH COLLECTED</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100">
                    <div className="text-2xl font-black text-purple-600">₹{totalUpi.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold">ONLINE (UPI)</div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
                {filteredEntries.map((bill) => (
                    <div key={bill._id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold border ${getStatusStyles(bill.paymentType)}`}>
                                    {bill.paymentType === 'cash' ? '💵' : bill.paymentType === 'online' ? '📱' : '📒'}
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-gray-900 dark:text-white">₹{bill.totalAmount}</div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                                        <Calendar size={12} /> {formatDate(bill.createdAt)}
                                        <span className={`px-2 py-0.5 rounded-md border ${getStatusStyles(bill.paymentType)}`}>{bill.paymentType}</span>
                                    </div>
                                </div>
                            </div>
                            {bill.customerId && (
                                <div className="bg-gray-50 p-2 px-4 rounded-xl flex items-center gap-2">
                                    <User size={16} className="text-gray-400" />
                                    <div className="text-xs font-bold text-gray-700">+91 {bill.customerId.phoneNumber}</div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                            {bill.items.map((item: any, idx: number) => (
                                <div key={idx} className="bg-gray-50 border px-3 py-1 rounded-lg flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-600">{item.name}</span>
                                    <span className="text-[10px] font-black text-gray-400">×{item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
