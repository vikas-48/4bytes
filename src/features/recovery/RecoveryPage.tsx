import { useState, useEffect } from 'react';
import { Phone, ShieldCheck, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import DefaulterCard from '../../components/recovery/DefaulterCard';
import LiveCallModal, { type RecoveryCustomer } from '../../components/recovery/LiveCallModal';
import RecoveryMissionControl from '../../components/recovery/RecoveryMissionControl';
import { useToast } from '../../contexts/ToastContext';
import { customerApi } from '../../services/api';
import type { Customer } from '../../db/db';

export default function RecoveryPage() {
    const { addToast } = useToast();

    // Fetch all customers from API
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const response = await customerApi.getAll();
            setAllCustomers(response.data);
        } catch (e) {
            console.error("Failed to load customers", e);
            addToast("Failed to sync customers", "error");
        }
    };

    const [activeCall, setActiveCall] = useState<RecoveryCustomer | null>(null);
    const [isMissionControlOpen, setIsMissionControlOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'ACTION' | 'SCHEDULED'>('ACTION');

    // Action Queue: Balance > 0 AND (No promise date OR Promise date <= Now)
    const actionQueue = allCustomers?.filter(customer => {
        const hasBalance = customer.khataBalance > 0;
        const isPastPromiseDate = !customer.nextCallDate || (typeof customer.nextCallDate === 'number' && customer.nextCallDate <= Date.now());
        return hasBalance && isPastPromiseDate;
    }) || [];

    // Scheduled Queue: Balance > 0 AND (Promise date > Now)
    const scheduledQueue = allCustomers?.filter(customer => {
        const hasBalance = customer.khataBalance > 0;
        const isFuturePromiseDate = customer.nextCallDate && (typeof customer.nextCallDate === 'number' && customer.nextCallDate > Date.now());
        return hasBalance && isFuturePromiseDate;
    }) || [];

    const displayCustomers = (viewMode === 'ACTION' ? actionQueue : scheduledQueue).map(customer => {
        const createdAt = customer.createdAt
            ? (typeof customer.createdAt === 'string' ? new Date(customer.createdAt).getTime() : customer.createdAt)
            : Date.now();
        const daysOverdue = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
        let risk: 'LOW' | 'MEDIUM' | 'HIGH';
        const trustScore = customer.trustScore || 0;
        const khataBalance = customer.khataBalance || 0;

        if (trustScore >= 80 && khataBalance < 1000) risk = 'LOW';
        else if (trustScore >= 50 || khataBalance < 2000) risk = 'MEDIUM';
        else risk = 'HIGH';

        return {
            id: customer._id || (customer.id ? customer.id.toString() : 'unknown'),
            name: customer.name || 'Unknown',
            amount: khataBalance,
            days: daysOverdue > 0 ? daysOverdue : 1,
            phone: customer.phoneNumber, // Updated from phone to phoneNumber
            risk: risk,
            nextCallDate: customer.nextCallDate,
            recoveryStatus: customer.recoveryStatus
        };
    });

    const handleCallResult = (result: { status: string; promiseDate: string }) => {
        if (result.status === 'success') {
            addToast(`✅ Promise recorded: ${result.promiseDate}`, 'success');
        }
    };

    const totalPending = (allCustomers?.filter(c => c.khataBalance > 0) || []).reduce((sum, d) => sum + d.khataBalance, 0);
    const criticalCount = actionQueue.filter(c => {
        const trustScore = c.trustScore || 0;
        const khataBalance = c.khataBalance || 0;
        if (trustScore < 50 && khataBalance > 2000) return true;
        return false;
    }).length;

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#050505] relative p-4 pb-24">
            {/* BACKGROUND MESH */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>
            </div>

            {/* HEADER */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-600 rounded-2xl text-white shadow-lg shadow-red-600/20">
                            <Phone size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">AI Recovery Agent</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Automated Voice Collections</p>
                        </div>
                    </div>

                    {actionQueue.length > 0 && (
                        <button
                            onClick={() => setIsMissionControlOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95 group animate-neon"
                        >
                            <Zap size={20} className="fill-current group-hover:text-yellow-400 transition-colors" />
                            <span>LAUNCH MISSION CONTROL ({actionQueue.length})</span>
                        </button>
                    )}
                </div>
            </div>

            <main className="max-w-4xl mx-auto">
                {/* STATS HERO */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white dark:bg-[#0A0A0A] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Khata Dues</p>
                            <h3 className="text-3xl font-black text-blue-600 dark:text-blue-500">₹{totalPending.toLocaleString()}</h3>
                            <div className="flex items-center gap-1 text-blue-600 text-xs font-bold mt-2 font-mono">
                                <TrendingUp size={14} /> LIVE_IMPACT_REPORT
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-600 p-6 rounded-[2rem] shadow-xl shadow-red-600/20 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-red-200 text-[10px] font-black uppercase tracking-widest mb-1">Immediate Calls</p>
                            <h3 className="text-3xl font-black tracking-tighter">{actionQueue.length}</h3>
                            <div className="flex items-center gap-1 text-red-200 text-xs font-bold mt-2 font-mono">
                                <AlertTriangle size={14} /> CRITICAL_NODES: {criticalCount}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAB SWITCHER */}
                <div className="flex bg-gray-200 dark:bg-white/[0.03] p-1 rounded-2xl mb-6 w-fit border border-white/5">
                    <button
                        onClick={() => setViewMode('ACTION')}
                        className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${viewMode === 'ACTION' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xl' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        ACTION REQUIRED ({actionQueue.length})
                    </button>
                    <button
                        onClick={() => setViewMode('SCHEDULED')}
                        className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${viewMode === 'SCHEDULED' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xl' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        SCHEDULED ({scheduledQueue.length})
                    </button>
                </div>

                {/* LIST */}
                <div className="space-y-4">
                    {displayCustomers.length > 0 ? (
                        displayCustomers.map(customer => (
                            <DefaulterCard
                                key={customer.id}
                                customer={customer}
                                onRecover={(c) => setActiveCall(c)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-[#0A0A0A] rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="font-black text-gray-900 dark:text-white mb-1">
                                {viewMode === 'ACTION' ? 'All Dues Recovered!' : 'No Scheduled Calls'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                {viewMode === 'ACTION' ? 'Great job. Your ledger is clean.' : 'Future follow-ups will appear here.'}
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* LIVE CALL MODAL */}
            <LiveCallModal
                customer={activeCall}
                isOpen={!!activeCall}
                onClose={() => setActiveCall(null)}
                onResult={handleCallResult}
            />

            {/* MISSION CONTROL HUD */}
            <RecoveryMissionControl
                isOpen={isMissionControlOpen}
                onClose={() => setIsMissionControlOpen(false)}
                customers={actionQueue.map(c => ({
                    id: c._id || (c.id ? c.id.toString() : 'unknown'),
                    name: c.name,
                    amount: c.khataBalance,
                    phone: c.phoneNumber
                }))}
            />
        </div>
    );
}
