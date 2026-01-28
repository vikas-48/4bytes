import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, CheckCircle, ChevronRight, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbRef, runTransaction, db } from '../lib/firebase';

const GroupBuyCard = ({ deal, userId = 'shop_me' }: { deal: any, userId?: string }) => {
    const [pledge, setPledge] = useState(1);
    const [isJoined, setIsJoined] = useState(false);
    const [liveUnits, setLiveUnits] = useState(deal.current_units);

    // Calculate Progress (using live units for animation)
    const percent = Math.min((liveUnits / deal.target_units) * 100, 100);
    const isUnlocked = percent >= 100;

    // Calculate Savings
    const marketTotal = deal.market_price * pledge;
    const dealTotal = deal.deal_price * pledge;
    const savings = marketTotal - dealTotal;

    // Ghost Live Activity - Simulate real-time joins
    useEffect(() => {
        if (isUnlocked || liveUnits >= deal.target_units) return;

        // Random interval between 8-15 seconds
        const randomInterval = Math.floor(Math.random() * (15000 - 8000 + 1) + 8000);

        const timer = setInterval(() => {
            setLiveUnits((prev: number) => {
                if (prev >= deal.target_units) return prev;
                const newVal = prev + 1;
                console.log(`🔥 Live Activity: Someone joined! (${newVal}/${deal.target_units})`);
                return newVal;
            });
        }, randomInterval);

        return () => clearInterval(timer);
    }, [isUnlocked, deal.target_units, liveUnits]);

    const handleJoin = async () => {
        try {
            if (!db) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.7 },
                    colors: ['#22c55e', '#3b82f6', '#fbbf24']
                });
                setIsJoined(true);
                return;
            }

            const r = dbRef(db, `deals/${deal.id}`);
            await runTransaction(r, (current: any) => {
                if (!current) return current;
                current.current_units = (current.current_units || 0) + pledge;
                current.participants = current.participants || {};
                const p = current.participants[userId] || { name: 'My Store', units: 0 };
                p.units += pledge;
                p.joined_at = Date.now();
                current.participants[userId] = p;

                if (current.current_units >= current.target_units) {
                    current.status = 'UNLOCKED';
                }
                return current;
            });

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.7 },
                colors: ['#22c55e', '#3b82f6', '#fbbf24']
            });
            setIsJoined(true);

        } catch (e) {
            console.error("Join failed", e);
            // Fallback for purely visual demo if DB writes fail (e.g. permission issues or offline)
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.7 },
                colors: ['#22c55e', '#3b82f6', '#fbbf24']
            });
            setIsJoined(true);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative w-full max-w-4xl mx-auto mb-8 group"
        >
            {/* GLOW EFFECT BEHIND CARD */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${isUnlocked ? 'from-green-400 to-emerald-600' : 'from-blue-600 to-violet-600'} rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200`} />

            <div className="relative bg-white dark:bg-gray-800 rounded-[1.8rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">

                {/* BACKGROUND PATTERN */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-bl-[100%] -z-10" />
                <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl font-black tracking-tighter text-gray-900 dark:text-white select-none pointer-events-none rotate-12">
                    {deal.category || 'DEAL'}
                </div>

                <div className="flex flex-col md:flex-row">

                    {/* LEFT: IMAGE & PRODUCT INFO */}
                    <div className="md:w-2/5 p-8 relative">
                        {/* Floating Badge */}
                        <div className="absolute top-6 left-6 z-20">
                            {isUnlocked ? (
                                <div className="bg-green-500/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-green-500/30 flex items-center gap-1 animate-pulse-slow">
                                    <CheckCircle size={14} /> UNLOCKED
                                </div>
                            ) : (
                                <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-red-500/30 flex items-center gap-1 animate-bounce">
                                    <Clock size={14} /> ENDING SOON
                                </div>
                            )}
                        </div>

                        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <img src={deal.image_url} alt={deal.product_name} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                        </div>

                        {/* AI Insight Overlay */}
                        <div className="mt-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-xl p-3 flex gap-3 items-start">
                            <div className="bg-violet-100 dark:bg-violet-800 p-2 rounded-full">
                                <Zap size={16} className="text-violet-600 dark:text-violet-300" />
                            </div>
                            <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                                <span className="font-bold">AI Insight:</span> {deal.aiInsight?.message || 'Based on your sales history, you will stock out in 4 days. This deal is optimal.'}
                            </p>
                        </div>

                        {/* Drop Point Display */}
                        {deal.anchorShop && (
                            <div className="mt-3 flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg w-fit">
                                <MapPin size={12} className="text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-500 dark:text-gray-400">Drop Point:</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{deal.anchorShop}</span>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: ACTION ZONE */}
                    <div className="md:w-3/5 p-8 pl-0 flex flex-col justify-between">

                        <div>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight leading-none mb-2">
                                {deal.product_name}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">Premium quality inventory for your store.</p>

                            {/* PRICE BLOCK */}
                            <div className="flex items-end gap-4 mb-8">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Group Price</p>
                                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                                        ₹{deal.deal_price}
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0">Market</p>
                                    <div className="text-2xl font-bold text-gray-400 line-through decoration-red-400 decoration-2">
                                        ₹{deal.market_price}
                                    </div>
                                </div>
                                <div className="mb-3 ml-auto">
                                    <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-lg font-bold text-sm">
                                        SAVE {Math.round((1 - deal.deal_price / deal.market_price) * 100)}%
                                    </span>
                                </div>
                            </div>

                            {/* PROGRESS BAR (The "Liquid" Effect) */}
                            <div className="mb-8">
                                <div className="flex justify-between text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">
                                    <span>{liveUnits} pledged</span>
                                    <span>Goal: {deal.target_units}</span>
                                </div>
                                <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner relative">
                                    {/* Shimmer Effect */}
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percent}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className={`absolute top-0 left-0 h-full ${percent > 80 ? 'progress-bar-shimmer' : isUnlocked ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'}`}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                                    </motion.div>
                                </div>
                                <p className={`text-right text-xs font-bold mt-1 ${isUnlocked ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {isUnlocked ? '🚀 WHOLESALE PRICE UNLOCKED!' : `${Math.max(0, deal.target_units - liveUnits)} more units needed`}
                                </p>
                            </div>
                        </div>

                        {/* ACTION FOOTER */}
                        {!isJoined ? (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-bold text-gray-500 dark:text-gray-300">How much do you need?</span>
                                    <span className="text-2xl font-black text-gray-800 dark:text-white">{pledge} <span className="text-sm text-gray-400 font-normal">units</span></span>
                                </div>

                                <input
                                    type="range"
                                    min="1" max="10"
                                    value={pledge}
                                    onChange={(e) => setPledge(parseInt(e.target.value))}
                                    className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white mb-6 hover:accent-gray-800 transition-all"
                                />

                                <button
                                    onClick={handleJoin}
                                    className="w-full relative group overflow-hidden bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-lg shadow-xl shadow-gray-200 dark:shadow-none hover:shadow-2xl transition-all active:scale-95"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    <span className="flex items-center justify-center gap-2">
                                        Join Deal <ChevronRight size={20} />
                                    </span>
                                </button>

                                <div className="text-center mt-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    You save <span className="text-green-600 dark:text-green-400 font-bold">₹{savings}</span> instantly
                                </div>

                                {/* WhatsApp Viral Loop Button */}
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`🔥 Hey! Join this ${deal.product_name} deal on GraminLink. We need ${Math.max(0, deal.target_units - liveUnits)} more units to unlock ₹${deal.deal_price} price! Market price: ₹${deal.market_price}. Join now: https://gramin-link.app/deal/${deal.id}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-[#25D366]/10 border-2 border-[#25D366]/30 rounded-xl text-[#25D366] hover:bg-[#25D366]/20 font-bold transition-colors mt-3"
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    Invite Neighbors ({Math.max(0, deal.target_units - liveUnits)} needed)
                                </a>
                            </div>
                        ) : (
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-2xl p-6 text-center border border-green-100 dark:border-green-800 animate-pop">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-green-800 dark:text-green-300">You're In!</h3>
                                <p className="text-green-600 dark:text-green-400">You saved ₹{savings}. Stock arrives tomorrow.</p>
                            </div>
                        )}

                    </div>
                </div>

                {/* LIVE TICKER FOOTER */}
                <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3 flex items-center gap-4 overflow-hidden rounded-b-[1.8rem]">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase whitespace-nowrap">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Live Activity
                    </div>
                    <div className="flex gap-8 animate-marquee whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-medium w-full">
                        {Object.entries(deal.participants || {}).map(([id, p]: [string, any]) => (
                            <span key={id}>🏪 <strong>{p.name}</strong> pledged {p.units} units</span>
                        ))}
                        {(!deal.participants || Object.keys(deal.participants).length === 0) && (
                            <span>Waiting for first participant...</span>
                        )}
                    </div>
                </div>

                {/* TRUST MAP (NEIGHBOR MAP) */}
                <div className="mt-[-1rem] px-6 pb-6 pt-2 h-24 relative overflow-hidden group-hover:h-32 transition-all duration-300 rounded-b-[1.8rem] bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                    {/* Fake Map Background */}
                    <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: 'url(https://assets.website-files.com/5a8dc0e62a014e0001b6365a/5a9437198e3745000100d071_map-bg.png)' }}></div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white/90 dark:bg-black/80 backdrop-blur text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10 text-gray-800 dark:text-white border border-gray-100 dark:border-gray-700">
                            {Object.keys(deal.participants || {}).length + 2} Neighbors joined nearby
                        </span>
                    </div>

                    {/* Pulsing Dots */}
                    <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                    <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"></div>

                    <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-green-500 rounded-full animate-ping delay-75"></div>
                    <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
            </div>
        </motion.div>
    );
};

export default GroupBuyCard;
