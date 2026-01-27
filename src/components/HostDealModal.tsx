import { useState } from 'react';
import { X, Package, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTED_ITEMS = [
    { name: "Tata Salt (1kg x 50)", market: 1400, deal: 1100, img: "https://m.media-amazon.com/images/I/51+2+1+1+1L._AC_UF1000,1000_QL80_.jpg" },
    { name: "Surf Excel (4kg x 4)", market: 2200, deal: 1800, img: "https://m.media-amazon.com/images/I/61+2+1+1+1L._AC_UF1000,1000_QL80_.jpg" },
    { name: "Maggi 2-Min (24 Packs)", market: 360, deal: 280, img: "https://m.media-amazon.com/images/I/81+2+1+1+1L._AC_UF1000,1000_QL80_.jpg" }
];

const HostDealModal = ({ isOpen, onClose, onHost }: { isOpen: boolean, onClose: () => void, onHost: (deal: any) => void }) => {
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [target, setTarget] = useState(10);

    const handleSubmit = () => {
        if (!selectedItem) return;

        // Create new deal object
        const newDeal = {
            id: `deal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            product_name: selectedItem.name,
            image_url: selectedItem.img, // Placeholder
            category: "REQUESTED",
            market_price: selectedItem.market,
            deal_price: selectedItem.deal,
            target_units: target,
            current_units: 1, // User starts it
            participants: { 'shop_me': { name: 'My Shop', units: 1, joinedAt: Date.now() } },
            aiInsight: { type: 'opportunity', message: "High demand in your area. Likely to fill in 24h.", confidence: 90 },
            status: 'ACTIVE'
        };

        onHost(newDeal);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                        className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-black dark:bg-gray-900 text-white p-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="bg-white/20 p-2 rounded-lg"><Package size={20} /></div>
                                    <h2 className="text-xl font-bold">Host a Group Buy</h2>
                                </div>
                                <button onClick={onClose} className="bg-white/20 p-1 rounded-full hover:bg-white/30"><X size={18} /></button>
                            </div>
                            <p className="text-gray-400 text-sm mt-2">Start a pool. We'll find neighbors to join you.</p>
                        </div>

                        <div className="p-6">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-3">Select Product to Request</h3>
                            <div className="grid grid-cols-1 gap-3 mb-6">
                                {SUGGESTED_ITEMS.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedItem(item)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer flex justify-between items-center transition-all ${selectedItem?.name === item.name
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{item.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Target Savings: <span className="text-green-600 dark:text-green-400 font-bold">₹{item.market - item.deal}</span></p>
                                        </div>
                                        {selectedItem?.name === item.name && <div className="bg-blue-600 text-white rounded-full p-1"><Sparkles size={12} /></div>}
                                    </div>
                                ))}
                            </div>

                            {selectedItem && (
                                <div className="mb-6 animate-fade-in">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Target Goal (Units)</label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <input
                                            type="range" min="5" max="50" step="5"
                                            value={target} onChange={(e) => setTarget(parseInt(e.target.value))}
                                            className="flex-1 accent-black dark:accent-white h-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                                        />
                                        <span className="font-black text-xl w-10 text-gray-900 dark:text-white">{target}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={!selectedItem}
                                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-blue-200/50 hover:scale-[1.02] transition-all"
                            >
                                Launch Deal <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default HostDealModal;
