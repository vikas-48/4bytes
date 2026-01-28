import React, { useState, useEffect } from 'react';
import { db, type Ledger } from '../../db/db';
import { Receipt, Calendar, IndianRupee, User, Phone, Tag } from 'lucide-react';

export const LedgerPage: React.FC = () => {
    const [ledgerEntries, setLedgerEntries] = useState<Ledger[]>([]);
    const [filterMode, setFilterMode] = useState<'ALL' | 'CASH' | 'UPI' | 'LEDGE'>('ALL');

    useEffect(() => {
        loadLedger();
    }, []);

    const loadLedger = async () => {
        const entries = await db.ledger.orderBy('timestamp').reverse().toArray();
        setLedgerEntries(entries);
    };

    const filteredEntries = filterMode === 'ALL'
        ? ledgerEntries
        : ledgerEntries.filter(e => e.paymentMode === filterMode);

    const totalCash = ledgerEntries
        .filter(e => e.paymentMode === 'CASH')
        .reduce((sum, e) => sum + e.billTotal, 0);

    const totalUpi = ledgerEntries
        .filter(e => e.paymentMode === 'UPI')
        .reduce((sum, e) => sum + e.billTotal, 0);

    const totalLedge = ledgerEntries
        .filter(e => e.paymentMode === 'LEDGE')
        .reduce((sum, e) => sum + e.billTotal, 0);

    const totalRevenue = ledgerEntries
        .filter(e => e.paymentMode !== 'LEDGE')
        .reduce((sum, e) => sum + e.billTotal, 0);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
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
            case 'CASH': return 'bg-green-100 text-green-700 border-green-200';
            case 'UPI': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'LEDGE': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">Business Ledger</h2>
                    <p className="text-gray-500 text-sm">Real-time settlement & credit tracking</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                    {(['ALL', 'CASH', 'UPI', 'LEDGE'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setFilterMode(mode)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterMode === mode
                                    ? 'bg-primary-green text-white shadow-lg shadow-primary-green/20'
                                    : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary-green/10 rounded-2xl flex items-center justify-center text-primary-green">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cash flow</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold">EXCLUDING LEDGE</div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600">
                            <Tag size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Ledge</span>
                    </div>
                    <div className="text-2xl font-black text-orange-600">₹{totalLedge.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold">{ledgerEntries.filter(e => e.paymentMode === 'LEDGE').length} PENDING ACCOUNTS</div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-600/10 rounded-2xl flex items-center justify-center text-green-600">
                            <span className="text-lg">💵</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cash Box</span>
                    </div>
                    <div className="text-2xl font-black text-green-600">₹{totalCash.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold">PHYSICAL CURRENCY</div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-600">
                            <span className="text-lg">📱</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Digital UPI</span>
                    </div>
                    <div className="text-2xl font-black text-purple-600">₹{totalUpi.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold">BANK SETTLEMENTS</div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
                {filteredEntries.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700 text-center">
                        <Receipt size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-500 font-bold">No entries found for this filter</p>
                    </div>
                ) : (
                    filteredEntries.map((entry) => (
                        <div
                            key={entry.id}
                            className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold border ${getStatusStyles(entry.paymentMode)}`}>
                                        {entry.paymentMode === 'CASH' ? '💵' : entry.paymentMode === 'UPI' ? '📱' : '📒'}
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-gray-900 dark:text-white">₹{entry.billTotal}</div>
                                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(entry.timestamp)}</span>
                                            <span className={`px-2 py-0.5 rounded-md border ${getStatusStyles(entry.paymentMode)}`}>{entry.paymentMode}</span>
                                        </div>
                                    </div>
                                </div>

                                {entry.customerPhone && (
                                    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                                            <User size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[120px]">
                                                {entry.customerName || 'Anonymous'}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                <Phone size={10} /> +91 {entry.customerPhone}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Item breakdown tag-style */}
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50 dark:border-gray-700">
                                {entry.items.map((item, idx) => (
                                    <div key={idx} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{item.name}</span>
                                        <span className="text-[10px] font-black bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-gray-400">×{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Local Icon
const TrendingUp = ({ className, size }: { className?: string, size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
);
