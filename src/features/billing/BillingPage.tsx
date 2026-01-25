import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer } from '../../db/db';
import { useCart } from '../../contexts/CartContext';
import { IndianRupee, CheckCircle, User, X } from 'lucide-react';

export const BillingPage: React.FC = () => {
    const products = useLiveQuery(() => db.products.toArray());
    const customers = useLiveQuery(() => db.customers.toArray());
    const { cart, addToCart, clearCart, cartTotal } = useCart();

    const [showCheckout, setShowCheckout] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'KHATA' | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    const handleTransaction = async () => {
        if (paymentMethod === 'KHATA' && !selectedCustomerId) return;

        const transaction = {
            timestamp: Date.now(),
            type: 'SALE' as const,
            amount: cartTotal,
            items: cart.map(i => ({ productId: i.id!, name: i.name, quantity: i.quantity, price: i.price })),
            customerId: selectedCustomerId || undefined,
            paymentMethod: paymentMethod!
        };

        try {
            await db.transaction('rw', db.products, db.customers, db.transactions, async () => {
                // 1. Add Transaction
                await db.transactions.add(transaction);

                // 2. Update Stock
                for (const item of cart) {
                    const product = await db.products.get(item.id!);
                    if (product) {
                        await db.products.update(item.id!, { stock: product.stock - item.quantity });
                    }
                }

                // 3. Update Customer (if Khata or just tracking visit)
                if (selectedCustomerId) {
                    const customer = await db.customers.get(selectedCustomerId);
                    if (customer) {
                        const updates: Partial<Customer> = {
                            visitValidation: (customer.visitValidation || 0) + 1,
                            lastVisit: Date.now()
                        };
                        if (paymentMethod === 'KHATA') {
                            updates.khataBalance = (customer.khataBalance || 0) + cartTotal;
                        }
                        // Simple Trust Score Recalculation
                        updates.trustScore = Math.min(100, (customer.trustScore || 100) + 1); // Visit bonus

                        await db.customers.update(selectedCustomerId, updates);
                    }
                }
            });

            alert('Transaction Successful!');
            clearCart();
            setShowCheckout(false);
            setPaymentMethod(null);
            setSelectedCustomerId(null);
        } catch (e) {
            console.error(e);
            alert('Transaction Failed');
        }
    };

    return (
        <div className="h-full flex flex-col relative bg-gray-50">
            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 content-start">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Tap to Add</h2>
                <div className="grid grid-cols-2 gap-3 pb-24">
                    {products?.map(product => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center aspect-square active:scale-95 transition-transform"
                        >
                            <div className="text-4xl mb-2">📦</div>
                            <span className="font-bold text-gray-900 leading-tight block w-full text-center truncate">{product.name}</span>
                            <span className="text-primary-green font-bold text-sm mt-1">₹{product.price}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cart Drawer */}
            {cart.length > 0 && (
                <div className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-30 animate-slide-up">
                    {/* Header Bar */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl" onClick={() => setShowCheckout(!showCheckout)}>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary-green text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                {cart.reduce((acc, item) => acc + item.quantity, 0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 font-medium">TOTAL</span>
                                <span className="text-2xl font-black text-gray-900">₹{cartTotal}</span>
                            </div>
                        </div>
                        {showCheckout ? (
                            <button onClick={(e) => { e.stopPropagation(); setShowCheckout(false); }} className="p-2 bg-gray-200 rounded-full"><X size={20} /></button>
                        ) : (
                            <button
                                onClick={() => setShowCheckout(true)}
                                className="bg-primary-green text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
                            >
                                Checkout
                                <IndianRupee size={18} />
                            </button>
                        )}
                    </div>

                    {/* Checkout Content */}
                    {showCheckout && (
                        <div className="p-6">
                            {/* Payment Method Selection */}
                            {!paymentMethod ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => { setPaymentMethod('CASH'); handleTransaction(); }} // Immediate Cash Checkout (No Customer tracking optional for simple cash)
                                        className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-2xl font-bold text-lg flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
                                    >
                                        <CheckCircle size={32} className="mb-2" />
                                        CASH
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('KHATA')}
                                        className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-2xl font-bold text-lg flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
                                    >
                                        <div className="text-3xl mb-2">📒</div>
                                        KHATA
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <button onClick={() => setPaymentMethod(null)} className="text-sm text-gray-500 underline">Back</button>
                                        <h3 className="font-bold text-lg">Select Customer for Khata</h3>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {customers?.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { setSelectedCustomerId(c.id!); }} // Click to select style
                                                className={`w-full p-3 rounded-xl border-2 flex justify-between items-center ${selectedCustomerId === c.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"><User size={20} /></div>
                                                    <div className="text-left">
                                                        <div className="font-bold">{c.name}</div>
                                                        <div className="text-xs text-gray-500">{c.phone}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500">Balance</div>
                                                    <div className="font-bold text-red-500">₹{c.khataBalance}</div>
                                                </div>
                                            </button>
                                        ))}
                                        <button className="w-full p-3 text-center text-orange-500 font-bold border-2 border-dashed border-orange-300 rounded-xl">
                                            + New Customer
                                        </button>
                                    </div>

                                    {selectedCustomerId && (
                                        <button
                                            onClick={handleTransaction}
                                            className="w-full bg-orange-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg mt-4"
                                        >
                                            Confirm Khata (₹{cartTotal})
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
