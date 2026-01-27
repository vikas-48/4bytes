import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles } from 'lucide-react';
import GroupBuyCard from '../../components/GroupBuyCard';
import HostDealModal from '../../components/HostDealModal'; // Import Modal
import { db, dbRef, onValue, dbUpdate } from '../../lib/firebase';
import { useToast } from '../../contexts/ToastContext';

const MOCK_DEAL = {
    id: "deal_01",
    product_name: "Madhur Sugar (50kg Bag)",
    image_url: "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=400&q=80", // Updated image
    market_price: 2200,
    deal_price: 1850,
    target_units: 10,
    current_units: 8,
    category: "SUGAR",
    participants: {
        "shop_1": { name: "Raju Kirana", units: 5 },
        "shop_2": { name: "Sharma Gen Store", units: 3 }
    }
};

export default function GroupBuyPage() {
    const [activeDeals, setActiveDeals] = useState<any[]>([MOCK_DEAL]);
    // @ts-ignore
    const { addToast } = useToast();
    const [isHostModalOpen, setIsHostModalOpen] = useState(false); // Modal State

    useEffect(() => {
        try {
            if (!db) return;
            const r = dbRef(db, 'deals');
            const unsub = onValue(r, (snap: any) => {
                const val = snap.val();
                if (val) {
                    // convert object to array
                    const dealsArr = Object.entries(val).map(([k, v]) => ({ id: k, ...(v as any) }));
                    // Sort deals (newer first or active first)
                    setActiveDeals(dealsArr.reverse());
                }
            });
            return () => unsub();
        } catch (e) {
            console.error("Firebase listen error", e);
        }
    }, []);

    const handleNewDeal = async (newDeal: any) => {
        try {
            if (db) {
                const r = dbRef(db, `deals/${newDeal.id}`);
                await dbUpdate(r, newDeal);
                addToast("🎉 Deal Launched! Recruiting neighbors...", "success");
            } else {
                setActiveDeals(prev => [newDeal, ...prev]);
                addToast("🎉 Demo Deal Launched!", "success");
            }
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
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 bg-opacity-80 backdrop-blur-lg rounded-2xl mb-6 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">GroupBuy</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Wholesale Aggregator</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsHostModalOpen(true)} className="hidden md:flex bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity animate-pulse-slow shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                            + Host New Deal
                        </button>
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs text-gray-400 font-bold uppercase">Total Saved</span>
                            <span className="text-green-600 font-bold">₹4,250</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                            <span className="text-lg">🏪</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="max-w-4xl mx-auto">

                {/* HERO BANNER */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 mb-10 text-white relative overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-4 border border-white/10">
                            <Sparkles size={12} className="text-yellow-400" />
                            <span>AI POWERED</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-2">Unlock Wholesale Power.</h2>
                        <p className="text-gray-400 max-w-lg text-sm md:text-base">
                            Join forces with 120+ local shops. Pledge together to unlock up to 40% discounts on premium inventory.
                        </p>
                        <button onClick={() => setIsHostModalOpen(true)} className="md:hidden mt-4 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold">
                            + Host New Deal
                        </button>
                    </div>
                </motion.div>

                {/* ACTIVE DEALS */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            🔥 Live Deals <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">{activeDeals.length} Active</span>
                        </h3>
                    </div>

                    {activeDeals.map((deal) => (
                        <GroupBuyCard key={deal.id} deal={deal} />
                    ))}
                </div>

                {/* Host Deal Modal */}
                <HostDealModal
                    isOpen={isHostModalOpen}
                    onClose={() => setIsHostModalOpen(false)}
                    onHost={handleNewDeal}
                />

            </main>
        </div>
    );
}
