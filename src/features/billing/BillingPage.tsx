import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { productApi, customerApi, billApi } from '../../services/api';
import { IndianRupee, X, Search, Mic, MicOff, Plus, Minus, Trash2, Phone, User, ChevronRight } from 'lucide-react';

export const BillingPage: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
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
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | 'ledger' | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [upiProcessing, setUpiProcessing] = useState(false);

    // Customer identification states
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const response = await productApi.getAll();
            setProducts(response.data);
        } catch (err) {
            console.error('Failed to load products', err);
        }
    };

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
            const response = await customerApi.create({ phoneNumber });
            setSelectedCustomer(response.data);
            setCheckoutStep('PAYMENT');
            addToast(response.status === 201 ? 'New customer created' : 'Customer identified', 'success');
        } catch (e) {
            console.error(e);
            addToast('Error identifying customer', 'error');
        }
    };

    const processTransaction = async (method: 'cash' | 'online' | 'ledger') => {
        if (!selectedCustomer) return;

        try {
            const response = await billApi.create({
                customerPhoneNumber: selectedCustomer.phoneNumber,
                items: cart.map(i => ({ productId: i._id, quantity: i.quantity, price: i.price })),
                paymentType: method
            });

            addToast('Transaction successful!', 'success');
            clearCart();
            closeCheckout();

            // Reload products to get updated stock
            loadProducts();
        } catch (e: any) {
            console.error(e);
            addToast(e.response?.data?.message || 'Transaction Failed', 'error');
        }
    };

    const handleCashPayment = () => processTransaction('cash');

    const handleUpiPayment = () => {
        setShowUpiModal(true);
        setUpiProcessing(true);

        // Simulate UPI payment delay
        setTimeout(async () => {
            await processTransaction('online');
            setUpiProcessing(false);
            setTimeout(() => {
                setShowUpiModal(false);
            }, 1000);
        }, 2000);
    };

    const handleLedgePayment = () => processTransaction('ledger');

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
                            key={product._id}
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
                            <span className="font-bold font-black">{t.viewCart}</span>
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

                    {/* Step 1: SUMMARY */}
                    {checkoutStep === 'SUMMARY' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.map(item => (
                                    <div key={item._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white text-lg">{item.name}</div>
                                                <div className="text-gray-500 dark:text-gray-400 text-sm">₹{item.price}/{item.unit}</div>
                                            </div>
                                            <div className="font-bold text-lg text-gray-900 dark:text-white">₹{item.price * item.quantity}</div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                                <button onClick={() => decreaseQuantity(item._id!)} className="w-8 h-8 bg-white dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-700 dark:text-white"><Minus size={16} /></button>
                                                <span className="font-bold text-gray-900 dark:text-white min-w-[30px] text-center">{item.quantity}</span>
                                                <button onClick={() => increaseQuantity(item._id!)} className="w-8 h-8 bg-white dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-700 dark:text-white"><Plus size={16} /></button>
                                            </div>
                                            <button onClick={() => decreaseQuantity(item._id!)} className="text-danger-red p-2 rounded-lg"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-lg">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-gray-500 font-medium">Items: {cart.length}</span>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-gray-900 dark:text-white">₹{cartTotal}</div>
                                    </div>
                                </div>
                                <button onClick={() => setCheckoutStep('CUSTOMER')} className="w-full bg-primary-green text-white py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2">Proceed <ChevronRight size={20} /></button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: CUSTOMER */}
                    {checkoutStep === 'CUSTOMER' && (
                        <div className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full">
                            <div className="text-center mb-8">
                                <Phone className="text-primary-green mx-auto mb-4" size={48} />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Identify Customer</h3>
                                <p className="text-gray-500">Phone-based single source of truth (MongoDB)</p>
                            </div>
                            <input
                                type="tel"
                                placeholder="Phone number"
                                maxLength={10}
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                className="w-full border-2 border-gray-200 py-4 px-4 rounded-2xl text-2xl font-bold text-center focus:border-primary-green outline-none mb-6"
                            />
                            <button onClick={identifyCustomer} disabled={phoneNumber.length !== 10} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg ${phoneNumber.length === 10 ? 'bg-primary-green text-white' : 'bg-gray-200 text-gray-400'}`}>Continue</button>
                        </div>
                    )}

                    {/* Step 3: PAYMENT */}
                    {checkoutStep === 'PAYMENT' && (
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <User size={24} className="text-gray-600" />
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">+91 {selectedCustomer?.phoneNumber}</div>
                                        <div className="text-xs text-gray-500">Cloud Account</div>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl border-2 text-center ${getLedgerColor(selectedCustomer?.khataBalance || 0)}`}>
                                    <div className="text-xs uppercase font-bold">Dues</div>
                                    <div className="text-lg font-black font-mono">₹{selectedCustomer?.khataBalance || 0}</div>
                                </div>
                            </div>

                            {!paymentMethod ? (
                                <div className="space-y-4">
                                    <button onClick={() => setPaymentMethod('cash')} className="w-full bg-green-600 text-white p-6 rounded-2xl font-bold text-xl flex items-center gap-4 shadow-lg"><span className="text-2xl">💵</span>CASH</button>
                                    <button onClick={() => setPaymentMethod('online')} className="w-full bg-purple-600 text-white p-6 rounded-2xl font-bold text-xl flex items-center gap-4 shadow-lg"><span className="text-2xl">📱</span>UPI (Online)</button>
                                    <button onClick={() => setPaymentMethod('ledger')} className="w-full bg-orange-500 text-white p-6 rounded-2xl font-bold text-xl flex items-center gap-4 shadow-lg"><span className="text-2xl">📒</span>LEDGE (Khata)</button>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 text-center">
                                    <div className="text-5xl font-black text-gray-900 dark:text-white mb-8">₹{cartTotal}</div>
                                    <button onClick={paymentMethod === 'online' ? handleUpiPayment : paymentMethod === 'cash' ? handleCashPayment : handleLedgePayment} className="w-full bg-primary-green text-white p-5 rounded-2xl font-bold text-lg shadow-lg">Confirm {paymentMethod.toUpperCase()}</button>
                                    <button onClick={() => setPaymentMethod(null)} className="mt-4 text-gray-500 underline">Back</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showUpiModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
                        {upiProcessing ? <div className="w-20 h-20 border-8 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div> : <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">✅</span></div>}
                        <h3 className="text-2xl font-bold">{upiProcessing ? 'Processing...' : 'Success!'}</h3>
                    </div>
                </div>
            )}
        </div>
    );
};
