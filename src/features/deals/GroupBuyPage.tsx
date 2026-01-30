import { useEffect, useState } from 'react';

import { ShoppingBag, Truck } from 'lucide-react';
import GroupBuyCard from '../../components/GroupBuyCard';
import HostDealModal from '../../components/HostDealModal';
import DigitalPassModal from '../../components/DigitalPassModal';
import { groupBuyApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import type { Deal } from '../../db/db';
import { MY_ORDERS } from '../../data/orderHistory';

export default function GroupBuyPage() {
    const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
    const { addToast } = useToast();
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [view, setView] = useState<'active' | 'history'>('active');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDeals();
    }, []);

    const loadDeals = async () => {
        setLoading(true);
        try {
            const response = await groupBuyApi.getAll();
            setActiveDeals(response.data);
        } catch (e) {
            console.error("Failed to load deals", e);
        } finally {
            setLoading(false);
        }
    };

    const handleNewDeal = async (newDeal: any) => {
        try {
            await groupBuyApi.create({
                groupName: newDeal.groupName, // Use the proper name
                products: newDeal.products,
                totalAmount: newDeal.totalAmount,
                marketPrice: newDeal.marketPrice,
                dealPrice: newDeal.dealPrice,
                targetUnits: newDeal.targetUnits,
                currentUnits: 0,
                category: newDeal.category,
                image_url: newDeal.image_url,
                aiInsight: "Host-Optimized Deal",
                tiers: [
                    { goal: Math.round(newDeal.targetUnits * 0.1), price: Math.round(newDeal.marketPrice * 0.95), label: 'Silver' },
                    { goal: Math.round(newDeal.targetUnits * 0.5), price: Math.round(newDeal.marketPrice * 0.90), label: 'Gold' },
                    { goal: newDeal.targetUnits, price: newDeal.dealPrice, label: 'Platinum' }
                ],
                status: 'active'
            });
            addToast("🎉 Deal Launched on MongoDB Atlas!", "success");
            loadDeals();
            setIsHostModalOpen(false);
        } catch (e) {
            console.error("Error creating deal", e);
            addToast("Failed to launch deal", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-gray-900 relative p-4 pb-24">
            {/* BACKGROUND MESH */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>
            </div>

            {/* HEADER SECTION */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 sticky top-0 z-50 rounded-2xl mb-6 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Cloud GroupBuy</h1>
                            <p className="text-xs text-gray-500 font-medium">Aggregated Orders</p>
                        </div>
                    </div>
                    <button onClick={() => setIsHostModalOpen(true)} className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold shadow-lg">
                        + Host New Deal
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="max-w-4xl mx-auto">
                <div className="mb-6 flex gap-4 border-b">
                    <button onClick={() => setView('active')} className={`pb-3 px-2 text-sm font-bold ${view === 'active' ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}>Live Deals</button>
                    <button onClick={() => setView('history')} className={`pb-3 px-2 text-sm font-bold ${view === 'history' ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}>Cloud Orders</button>
                </div>

                {view === 'active' ? (
                    <div className="space-y-6 min-h-[50vh]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                                <p className="font-bold text-xs uppercase tracking-widest">Finding best prices...</p>
                            </div>
                        ) : activeDeals.length > 0 ? (
                            activeDeals.map((deal) => (
                                <GroupBuyCard key={deal._id} deal={deal} onShowPass={setSelectedOrder} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in opacity-50">
                                <ShoppingBag size={40} className="text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-gray-400 text-sm">No active deals right now.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // ... ORDER HISTORY LIST ...
                    <div className="space-y-4 animate-fade-in">
                        {MY_ORDERS.map((order) => (
                            <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">{order.dealName}</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-1">{order.date} • {order.quantity} Units</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${order.status === 'Delivered' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                                >
                                    <Truck size={14} /> View Pass
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <HostDealModal isOpen={isHostModalOpen} onClose={() => setIsHostModalOpen(false)} onHost={handleNewDeal} />
                <DigitalPassModal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} order={selectedOrder} />
            </main>
        </div>
    );
}
