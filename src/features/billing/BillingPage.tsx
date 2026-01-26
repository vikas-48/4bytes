import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer } from '../../db/db';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { IndianRupee, CheckCircle, User, X } from 'lucide-react';

export const BillingPage: React.FC = () => {
    const products = useLiveQuery(() => db.products.toArray());
    const customers = useLiveQuery(() => db.customers.toArray());
    const { cart, addToCart, clearCart, cartTotal } = useCart(); // Assuming removeFromCart exists or will add
    const { t } = useLanguage();

    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState<'SUMMARY' | 'PAYMENT'>('SUMMARY');
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
                        updates.trustScore = Math.min(100, (customer.trustScore ?? 0) + 1); // Visit bonus

                        await db.customers.update(selectedCustomerId, updates);
                    }
                }
            });

            alert('Transaction Successful!');
            clearCart();
            closeCheckout();
        } catch (e) {
            console.error(e);
            alert('Transaction Failed');
        }
    };

    const closeCheckout = () => {
        setShowCheckout(false);
        setCheckoutStep('SUMMARY');
        setPaymentMethod(null);
        setSelectedCustomerId(null);
    };

    return (
        <div className="h-full flex flex-col relative bg-gray-50 dark:bg-gray-900">
            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 content-start">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{t.tapToAdd}</h2>
                <div className="grid grid-cols-2 gap-3 pb-24">
                    {products?.map(product => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center aspect-square active:scale-95 transition-transform"
                        >
                            <div className="text-4xl mb-2">{product.icon || '📦'}</div>
                            <span className="font-bold text-gray-900 dark:text-gray-100 leading-tight block w-full text-center truncate">{product.name}</span>
                            <span className="text-primary-green font-bold text-sm mt-1">₹{product.price}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sticky Order Button (if not in checkout) */}
            {!showCheckout && cart.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 z-20">
                    <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full bg-primary-green text-white p-4 rounded-2xl shadow-lg flex justify-between items-center animate-slide-up"
                    >
                        <div className="flex items-center gap-3">
                            <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                            <span className="font-bold">{t.viewCart}</span>
                        </div>
                        <span className="font-black text-xl">₹{cartTotal}</span>
                    </button>
                </div>
            )}

            {/* FULL SCREEN CHECKOUT MODAL */}
            {showCheckout && (
                <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col animate-in slide-in-from-bottom duration-200">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center gap-3">
                        <button onClick={checkoutStep === 'SUMMARY' ? closeCheckout : () => setCheckoutStep('SUMMARY')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {checkoutStep === 'SUMMARY' ? t.orderSummary : t.paymentMethod}
                        </h2>
                    </div>

                    {/* Step 1: SUMMARY */}
                    {checkoutStep === 'SUMMARY' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white text-lg">{item.name}</div>
                                            <div className="text-gray-500 dark:text-gray-400 text-sm">₹{item.price} x {item.quantity}</div>
                                        </div>
                                        <div className="font-bold text-lg text-gray-900 dark:text-white">₹{item.price * item.quantity}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t.grandTotal}</span>
                                    <span className="text-3xl font-black text-gray-900 dark:text-white">₹{cartTotal}</span>
                                </div>
                                <button
                                    onClick={() => setCheckoutStep('PAYMENT')}
                                    className="w-full bg-primary-green text-white py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2"
                                >
                                    {t.proceedToPay} <IndianRupee size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: PAYMENT */}
                    {checkoutStep === 'PAYMENT' && (
                        <div className="flex-1 p-6 overflow-y-auto">
                            {/* Payment Method Selection */}
                            {!paymentMethod ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPaymentMethod('CASH')}
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
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setPaymentMethod(null)} className="text-sm text-gray-500 dark:text-gray-400 underline">{t.cancel}</button>
                                            <h3 className="font-bold text-lg dark:text-white">{t.customers}</h3>
                                        </div>
                                        {/* Guest Checkout Option for Cash */}
                                        {paymentMethod === 'CASH' && (
                                            <button
                                                onClick={() => { setSelectedCustomerId(null); handleTransaction(); }}
                                                className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-lg text-gray-700 dark:text-gray-300 font-medium"
                                            >
                                                Guest
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[60vh] overflow-y-auto space-y-2">
                                        {customers?.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { setSelectedCustomerId(c.id!); }}
                                                className={`w-full p-3 rounded-xl border-2 flex justify-between items-center ${selectedCustomerId === c.id
                                                    ? paymentMethod === 'KHATA'
                                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                                                        : 'border-primary-green bg-green-50 dark:bg-green-900/30'
                                                    : 'border-gray-100 dark:border-gray-700 dark:bg-gray-800'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center"><User size={20} className="dark:text-white" /></div>
                                                    <div className="text-left">
                                                        <div className="font-bold dark:text-white">{c.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {paymentMethod === 'KHATA' && (
                                                        <>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{t.balance}</div>
                                                            <div className="font-bold text-red-500">₹{c.khataBalance}</div>
                                                        </>
                                                    )}
                                                    {paymentMethod === 'CASH' && (
                                                        <>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{t.trust}</div>
                                                            <div className="font-bold text-primary-green">{c.trustScore || 0}%</div>
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                        {/* Add New Customer Button */}
                                        <button className={`w-full p-3 text-center font-bold border-2 border-dashed rounded-xl ${paymentMethod === 'KHATA'
                                            ? 'text-orange-500 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                                            : 'text-primary-green border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10'
                                            }`}>
                                            + {t.add} {t.customers}
                                        </button>
                                    </div>

                                    {selectedCustomerId && (
                                        <button
                                            onClick={handleTransaction}
                                            className={`w-full text-white p-4 rounded-xl font-bold text-lg shadow-lg mt-4 ${paymentMethod === 'KHATA' ? 'bg-orange-600' : 'bg-primary-green'
                                                }`}
                                        >
                                            {t.confirm} {paymentMethod} (₹{cartTotal})
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
