import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer } from '../../db/db';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { IndianRupee, X, Search, Mic, MicOff, Plus, Minus, Trash2, Phone, User, ChevronRight } from 'lucide-react';

export const BillingPage: React.FC = () => {
    const products = useLiveQuery(() => db.products.toArray());
    const { cart, addToCart, increaseQuantity, decreaseQuantity, clearCart, cartTotal } = useCart();
    const { t } = useLanguage();
    const { addToast } = useToast();
    // @ts-ignore
    const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition({
        onResult: (transcript) => {
            setSearchTerm(transcript);
        },
    });

    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState<'SUMMARY' | 'CUSTOMER' | 'PAYMENT'>('SUMMARY');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'LEDGE' | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [upiProcessing, setUpiProcessing] = useState(false);

    // Customer identification states
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const getLedgerColor = (balance: number) => {
        if (balance <= 500) return 'text-green-600 bg-green-50 border-green-200';
        if (balance <= 1500) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const identifyCustomer = async () => {
        if (phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
            addToast('Enter valid 10-digit phone number', 'error');
            return;
        }

        try {
            let customer = await db.customers.where('phone').equals(phoneNumber).first();

            if (!customer) {
                // Create new customer
                const newCustomer: Customer = {
                    phone: phoneNumber,
                    khataBalance: 0,
                    totalTransactions: 0,
                    trustScore: 100,
                    visitValidation: 0,
                    loyaltyPoints: 0,
                    totalPurchases: 0,
                    createdAt: Date.now()
                };
                const id = await db.customers.add(newCustomer);
                customer = { ...newCustomer, id };
                addToast('New customer created', 'success');
            } else {
                addToast('Customer found', 'success');
            }

            setSelectedCustomer(customer);
            setCheckoutStep('PAYMENT');
        } catch (e) {
            console.error(e);
            addToast('Error identifying customer', 'error');
        }
    };

    const processTransaction = async (method: 'CASH' | 'UPI' | 'LEDGE') => {
        if (!selectedCustomer) return;

        if (method === 'LEDGE') {
            if (selectedCustomer.khataBalance + cartTotal > 2000) {
                addToast('Ledge limit exceeded (₹2000 max)', 'error');
                return;
            }
        }

        try {
            await db.transaction('rw', [db.products, db.ledger, db.customers], async () => {
                // 1. Add to Ledger/Transactions
                await db.ledger.add({
                    billTotal: cartTotal,
                    paymentMode: method,
                    status: method === 'LEDGE' ? 'LEDGE' : 'PAID',
                    timestamp: Date.now(),
                    items: cart.map(i => ({ productId: i.id!, name: i.name, quantity: i.quantity, price: i.price })),
                    customerId: selectedCustomer.id,
                    customerName: selectedCustomer.name,
                    customerPhone: selectedCustomer.phone
                });

                // 2. Update Customer
                const updates: any = {
                    totalTransactions: (selectedCustomer.totalTransactions || 0) + 1,
                    totalPurchases: (selectedCustomer.totalPurchases || 0) + cartTotal,
                    lastVisit: Date.now(),
                    visitValidation: (selectedCustomer.visitValidation || 0) + 1
                };

                if (method === 'LEDGE') {
                    updates.khataBalance = selectedCustomer.khataBalance + cartTotal;
                }

                await db.customers.update(selectedCustomer.id!, updates);

                // 3. Update Stock
                for (const item of cart) {
                    const product = await db.products.get(item.id!);
                    if (product) {
                        await db.products.update(item.id!, { stock: product.stock - item.quantity });
                    }
                }
            });

            addToast(`${method === 'LEDGE' ? 'Ledge' : 'Payment'} successful!`, 'success');
            clearCart();
            closeCheckout();
        } catch (e) {
            console.error(e);
            addToast('Transaction Failed', 'error');
        }
    };

    const handleCashPayment = () => processTransaction('CASH');

    const handleUpiPayment = () => {
        setShowUpiModal(true);
        setUpiProcessing(true);

        // Simulate UPI payment
        setTimeout(async () => {
            await processTransaction('UPI');
            setUpiProcessing(false);
            setTimeout(() => {
                setShowUpiModal(false);
            }, 1000);
        }, 2000);
    };

    const handleLedgePayment = () => processTransaction('LEDGE');

    const closeCheckout = () => {
        setShowCheckout(false);
        setCheckoutStep('SUMMARY');
        setPaymentMethod(null);
        setShowUpiModal(false);
        setPhoneNumber('');
        setSelectedCustomer(null);
    };

    return (
        <div className="h-full flex flex-col relative bg-gray-50 dark:bg-gray-900">
            {/* Search Bar */}
            <div className="sticky top-0 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 space-y-3 z-30">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.tapToAdd}</h2>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-2 pl-10 placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>
                    {isSupported && (
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`px-3 py-2 rounded-lg transition-colors ${isListening
                                ? 'bg-danger-red text-white'
                                : 'bg-primary-green text-white'
                                }`}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 content-start">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pb-24">
                    {products?.filter(p =>
                        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.category.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(product => (
                        <button
                            key={product.id}
                            onClick={() => {
                                addToCart(product);
                                addToast(`${product.name} added to cart`, 'success');
                            }}
                            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center aspect-square active:scale-95 transition-transform hover:shadow-md"
                        >
                            <div className="text-4xl mb-2">{product.icon || '📦'}</div>
                            <span className="font-bold text-gray-900 dark:text-gray-100 leading-tight block w-full text-center truncate">{product.name}</span>
                            <span className="text-primary-green font-bold text-sm mt-1">₹{product.price}/{product.unit}</span>
                            {product.stock <= product.minStock && (
                                <span className="text-xs text-danger-red font-semibold mt-1">Low Stock</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sticky Order Button (if not in checkout) */}
            {!showCheckout && cart.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 z-20">
                    <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full bg-primary-green text-white p-4 rounded-2xl shadow-lg flex justify-between items-center animate-slide-up hover:shadow-xl transition-shadow"
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
                        <button
                            onClick={() => {
                                if (checkoutStep === 'SUMMARY') closeCheckout();
                                else if (checkoutStep === 'CUSTOMER') setCheckoutStep('SUMMARY');
                                else if (checkoutStep === 'PAYMENT' && !paymentMethod) setCheckoutStep('CUSTOMER');
                                else setPaymentMethod(null);
                            }}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center flex-1 pr-8">
                            {checkoutStep === 'SUMMARY' ? 'Order Summary' :
                                checkoutStep === 'CUSTOMER' ? 'Identify Customer' : 'Select Payment'}
                        </h2>
                    </div>

                    {/* Step 1: SUMMARY with Quantity Controls */}
                    {checkoutStep === 'SUMMARY' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white text-lg">{item.name}</div>
                                                <div className="text-gray-500 dark:text-gray-400 text-sm">₹{item.price}/{item.unit}</div>
                                            </div>
                                            <div className="font-bold text-lg text-gray-900 dark:text-white">₹{item.price * item.quantity}</div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                                <button
                                                    onClick={() => decreaseQuantity(item.id!)}
                                                    className="w-8 h-8 bg-white dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 active:scale-95 transition-all"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="font-bold text-gray-900 dark:text-white min-w-[30px] text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => increaseQuantity(item.id!)}
                                                    className="w-8 h-8 bg-white dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 active:scale-95 transition-all"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => decreaseQuantity(item.id!)}
                                                className="text-danger-red hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-lg">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Total Items: {cart.length}</span>
                                    <div className="text-right">
                                        <div className="text-gray-500 dark:text-gray-400 text-xs">Grand Total</div>
                                        <div className="text-3xl font-black text-gray-900 dark:text-white">₹{cartTotal}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCheckoutStep('CUSTOMER')}
                                    className="w-full bg-primary-green text-white py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2"
                                >
                                    Proceed <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: CUSTOMER IDENTIFICATION */}
                    {checkoutStep === 'CUSTOMER' && (
                        <div className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-primary-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Phone className="text-primary-green" size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Identify Customer</h3>
                                <p className="text-gray-500 dark:text-gray-400">Enter phone number to fetch customer record or create new one</p>
                            </div>

                            <div className="relative mb-6">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</div>
                                <input
                                    type="tel"
                                    placeholder="00000 00000"
                                    maxLength={10}
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 py-4 pl-14 pr-4 rounded-2xl text-2xl font-bold tracking-[0.2em] focus:border-primary-green outline-none transition-colors dark:text-white"
                                />
                            </div>

                            <button
                                onClick={identifyCustomer}
                                disabled={phoneNumber.length !== 10}
                                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition-all ${phoneNumber.length === 10 ? 'bg-primary-green text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed text-white'
                                    }`}
                            >
                                Continue <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    {/* Step 3: PAYMENT */}
                    {checkoutStep === 'PAYMENT' && (
                        <div className="flex-1 p-4 overflow-y-auto">
                            {/* Customer Profile Header */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                        <User size={24} className="text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white text-lg">+91 {selectedCustomer?.phone}</div>
                                        <div className="text-xs text-gray-500">Khata Active</div>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl border-2 text-center ${selectedCustomer ? getLedgerColor(selectedCustomer.khataBalance) : ''}`}>
                                    <div className="text-[10px] uppercase font-bold opacity-70">Balance</div>
                                    <div className="text-lg font-black font-mono">₹{selectedCustomer?.khataBalance}</div>
                                </div>
                            </div>

                            {!paymentMethod ? (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white px-2">Select Payment Mode</h3>

                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => setPaymentMethod('CASH')}
                                            className="bg-green-600 text-white p-6 rounded-2xl font-bold text-xl flex items-center gap-4 shadow-lg active:scale-[0.98] transition-all"
                                        >
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">💵</div>
                                            <div className="text-left">
                                                <div>CASH</div>
                                                <div className="text-sm font-normal opacity-80 text-white">Direct settlement</div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setPaymentMethod('UPI')}
                                            className="bg-purple-600 text-white p-6 rounded-2xl font-bold text-xl flex items-center gap-4 shadow-lg active:scale-[0.98] transition-all"
                                        >
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">📱</div>
                                            <div className="text-left">
                                                <div>UPI</div>
                                                <div className="text-sm font-normal opacity-80 text-white">Razorpay Test Mode</div>
                                            </div>
                                        </button>

                                        <div className="relative">
                                            <button
                                                onClick={() => setPaymentMethod('LEDGE')}
                                                disabled={(selectedCustomer?.khataBalance || 0) + cartTotal > 2000}
                                                className={`w-full p-6 rounded-2xl font-bold text-xl flex items-center gap-4 shadow-lg active:scale-[0.98] transition-all ${(selectedCustomer?.khataBalance || 0) + cartTotal > 2000
                                                    ? 'bg-gray-100 text-gray-400 grayscale border-2 border-dashed border-gray-300 shadow-none'
                                                    : 'bg-orange-500 text-white'
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${(selectedCustomer?.khataBalance || 0) + cartTotal > 2000 ? 'bg-gray-200' : 'bg-white/20'
                                                    }`}>📒</div>
                                                <div className="text-left">
                                                    <div>LEDGE (KHATA)</div>
                                                    <div className="text-sm font-normal opacity-80">Add to credit account</div>
                                                </div>
                                            </button>
                                            {(selectedCustomer?.khataBalance || 0) + cartTotal > 2000 && (
                                                <div className="absolute -top-3 -right-2 bg-red-600 text-white text-[10px] px-3 py-1 rounded-full font-black shadow-lg">
                                                    LIMIT EXCEEDED (₹2000)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 py-2">
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => setPaymentMethod(null)} className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                            ← Back to methods
                                        </button>
                                        <div className={`px-4 py-1 rounded-full font-bold text-xs ${paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' :
                                            paymentMethod === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {paymentMethod} MODE
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl text-center">
                                        <div className="text-gray-500 dark:text-gray-400 text-sm mb-1 uppercase tracking-wider font-bold">Payable Amount</div>
                                        <div className="text-5xl font-black text-gray-900 dark:text-white mb-8">₹{cartTotal}</div>

                                        {paymentMethod === 'CASH' && (
                                            <div className="space-y-4">
                                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-green-800 dark:text-green-300 text-sm">
                                                    Collect cash from <b>+91 {selectedCustomer?.phone}</b>
                                                </div>
                                                <button
                                                    onClick={handleCashPayment}
                                                    className="w-full bg-green-600 text-white p-5 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all"
                                                >
                                                    Mark as Paid
                                                </button>
                                            </div>
                                        )}

                                        {paymentMethod === 'UPI' && (
                                            <div className="space-y-4">
                                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-purple-800 dark:text-purple-300 text-sm">
                                                    Simulating secure UPI payment flow
                                                </div>
                                                <button
                                                    onClick={handleUpiPayment}
                                                    className="w-full bg-purple-600 text-white p-5 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all"
                                                >
                                                    Start UPI Payment
                                                </button>
                                            </div>
                                        )}

                                        {paymentMethod === 'LEDGE' && (
                                            <div className="space-y-4">
                                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl text-orange-800 dark:text-orange-300 text-sm">
                                                    New balance will be <b>₹{(selectedCustomer?.khataBalance || 0) + cartTotal}</b>
                                                </div>
                                                <button
                                                    onClick={handleLedgePayment}
                                                    className="w-full bg-orange-500 text-white p-5 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all"
                                                >
                                                    Confirm Ledge
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* UPI Processing Modal */}
            {showUpiModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl scale-in">
                        {upiProcessing ? (
                            <>
                                <div className="w-20 h-20 border-8 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connecting...</h3>
                                <p className="text-gray-500 dark:text-gray-400">Secure UPI test mode active. Do not close.</p>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-4xl">✅</span>
                                </div>
                                <h3 className="text-2xl font-bold text-green-600 mb-2">Success!</h3>
                                <p className="text-gray-500 dark:text-gray-400">Payment received via UPI</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
