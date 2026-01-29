import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Truck } from 'lucide-react';
import GroupBuyCard from '../../components/GroupBuyCard';
import HostDealModal from '../../components/HostDealModal';
import DigitalPassModal from '../../components/DigitalPassModal';
import { groupBuyApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { MY_ORDERS } from '../../data/orderHistory';

export default function GroupBuyPage() {
    const [activeDeals, setActiveDeals] = useState<any[]>([]);
    const { addToast } = useToast();
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [view, setView] = useState<'active' | 'history'>('active');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    useEffect(() => {
        loadDeals();
    }, []);

    const loadDeals = async () => {
        try {
            const response = await groupBuyApi.getAll();
            setActiveDeals(response.data);
        } catch (e) {
            console.error("Failed to load deals", e);
        }
    };

    const handleNewDeal = async (newDeal: any) => {
        try {
            await groupBuyApi.create({
                groupName: newDeal.product_name,
                products: [{ productId: newDeal.productId || null, quantity: newDeal.target_units }],
                totalAmount: newDeal.deal_price * newDeal.target_units,
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
                    <div className="space-y-6">
                        {activeDeals.map((deal) => (
                            <GroupBuyCard key={deal._id} deal={deal} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-center text-gray-500 py-10">Historical orders fetched from MongoDB</p>
                    </div>
                )}

                <HostDealModal isOpen={isHostModalOpen} onClose={() => setIsHostModalOpen(false)} onHost={handleNewDeal} />
                <DigitalPassModal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} order={selectedOrder} />
            </main>
        </div>
    );
}
