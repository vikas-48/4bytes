
import { useEffect, useState } from 'react';
import { MessageSquare, Package, Phone, IndianRupee } from 'lucide-react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

interface WhatsappEvent {
    type: string;
    data: any;
    timestamp: string;
}

export default function WhatsAppLiveFeed() {
    const [events, setEvents] = useState<WhatsappEvent[]>([]);
    const [collection, setCollection] = useState(0);
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        // === CONNECT TO REAL-TIME SERVER ===
        const socket = io(SOCKET_URL);
        socket.on('connect', () => {
            console.log("Connected to WhatsApp Socket");
        });

        socket.on('whatsapp-event', (event: WhatsappEvent) => {
            console.log("WebSocket Event:", event);
            setEvents(prev => [event, ...prev.slice(0, 15)]); // Keep last 15

            if (event.type === 'NEW_ORDER') {
                setOrders(prev => [event.data, ...prev]);
            }
            if (event.type === 'PAYMENT_INITIATED' || event.type === 'PAYMENT_RECEIVED') {
                // If amount exists, add it
                if (event.data.amount) setCollection(prev => prev + Number(event.data.amount));
            }
        });

        // === FETCH INITIAL DATA ===
        fetch(`${SOCKET_URL}/api/whatsapp/analytics`)
            .then(r => r.json())
            .then(data => {
                if (data) setCollection(data);
            })
            .catch(err => console.error("Failed to fetch analytics", err));

        return () => {
            socket.disconnect();
        };
    }, []);

    async function sendBulkReminder() {
        try {
            const response = await fetch(`${SOCKET_URL}/api/whatsapp/broadcast-reminders`, { method: 'POST' });
            const res = await response.json();
            if (res.success) {
                alert('Reminders sent to 50 customers! Watch the feed.');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to send reminders');
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto font-sans">
            {/* METRIC CARDS - THE MONEY SHOT */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg border border-emerald-400/30 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-white/10 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
                <IndianRupee className="float-right text-emerald-100 relative z-10" size={32} />
                <p className="text-sm opacity-90 font-medium tracking-wide relative z-10">WhatsApp Collection</p>
                <p className="text-4xl font-bold mt-2 relative z-10">₹{collection.toLocaleString('en-IN')}</p>
                <p className="text-xs opacity-75 mt-3 flex items-center gap-1 relative z-10">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-white font-bold">↑ 80%</span> vs Calls
                </p>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg border border-blue-400/30 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-white/10 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
                <Package className="float-right text-blue-100 relative z-10" size={32} />
                <p className="text-sm opacity-90 font-medium tracking-wide relative z-10">Live Orders</p>
                <p className="text-4xl font-bold mt-2 relative z-10">{orders.length}</p>
                <p className="text-xs opacity-75 mt-3 relative z-10">Via WhatsApp Support</p>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg border border-purple-400/30 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-white/10 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
                <Phone className="float-right text-purple-100 relative z-10" size={32} />
                <p className="text-sm opacity-90 font-medium tracking-wide relative z-10">Response Rate</p>
                <p className="text-4xl font-bold mt-2 relative z-10">92%</p>
                <p className="text-xs opacity-75 mt-3 relative z-10">Vs 15% Standard Calls</p>
            </div>

            {/* LIVE EVENT FEED - THE WOW FACTOR */}
            <div className="col-span-1 md:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <h3 className="font-bold text-xl flex items-center gap-3 mb-6 text-gray-800">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <MessageSquare className="text-green-600 h-6 w-6" />
                    </div>
                    WhatsApp ShopOS Command Center
                    <span className="ml-auto text-xs font-normal text-gray-400 bg-gray-50 px-2 py-1 rounded border">Live Connection</span>
                </h3>
                <div className="space-y-3 h-[400px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
                    {events.map((e, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-green-50/50 transition-colors rounded-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex gap-4 items-center">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm
                      ${e.type === 'NEW_ORDER' ? 'bg-blue-500' :
                                        e.type === 'PAYMENT_RECEIVED' ? 'bg-green-500' :
                                            e.type === 'SYSTEM' ? 'bg-gray-800' : 'bg-purple-500'}`}>
                                    {e.data.customer ? e.data.customer.charAt(0) : '?'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-lg">{e.data.customer || 'Customer'}
                                        {e.data.customerPhone && <span className="font-normal text-gray-500 text-xs ml-2">({e.data.customerPhone})</span>}
                                    </p>
                                    <p className="text-sm text-gray-600 font-medium">
                                        <span className="bg-gray-200 px-1.5 py-0.5 rounded text-xs uppercase tracking-wide mr-2 text-gray-700">{e.type.replace('_', ' ')}</span>
                                        <span className="text-gray-900">{e.data.item ? `Ordered: ${e.data.item}` : (e.data.amount ? ` Received ₹${e.data.amount}` : e.data.date || '')}</span>
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 font-mono bg-white px-2 py-1 rounded border shadow-sm">{new Date(e.timestamp || Date.now()).toLocaleTimeString()}</span>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <MessageSquare size={64} className="mb-4 text-gray-300" />
                            <p className="text-lg">Waiting for magic... Send a WhatsApp!</p>
                            <p className="text-sm">Sandbox Number: +1 415 523 8886</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-span-1 md:col-span-3 flex gap-4">
                <button
                    onClick={sendBulkReminder}
                    className="flex-1 bg-gradient-to-r from-gray-900 to-black text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all text-lg flex items-center justify-center gap-2 group border border-gray-800"
                >
                    <span className="group-hover:animate-pulse">🔥</span>
                    Send Payment Reminders to All Pending
                </button>
            </div>
        </div>
    );
}
