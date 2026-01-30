import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { productApi, customerApi, billApi } from '../../services/api';
import type { Customer } from '../../services/api';
import { db } from '../../db/db';
import type { Customer as LocalCustomer } from '../../db/db';
import { recalculateKhataScore, SCORE_DEFAULT, calculateKhataLimit, getKhataStatus, type KhataExplanation } from '../../lib/khataLogic';
import { X, Search, Plus, Minus, Trash2, User, ChevronRight, ShieldAlert, Award } from 'lucide-react';

export const BillingPage: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const { cart, addToCart, increaseQuantity, decreaseQuantity, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
    const { t } = useLanguage();
    const { addToast } = useToast();

    useSpeechRecognition({
        onResult: (transcript: string) => {
            setSearchTerm(transcript);
        },
    });

    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState<'SUMMARY' | 'CUSTOMER' | 'PAYMENT'>('SUMMARY');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | 'ledger' | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [animationType, setAnimationType] = useState<'cash' | 'online' | 'ledger' | null>(null);

    // Customer identification states
    const [customerInput, setCustomerInput] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<(Customer & LocalCustomer) | null>(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [khataInfo, setKhataInfo] = useState<KhataExplanation | null>(null);

    // Global Search State
    const [globalResults, setGlobalResults] = useState<Customer[]>([]);
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);

    useEffect(() => {
        loadProducts();
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const response = await customerApi.getAll();
            setAllCustomers(response.data);
        } catch (err) {
            console.error('Failed to load customers', err);
        }
    };

    // Effect: Global Search
    useEffect(() => {
        const fetchGlobal = async () => {
            // Reset if input is short
            if (!customerInput || customerInput.length < 3) {
                setGlobalResults([]);
                return;
            }

            setIsGlobalLoading(true);
            try {
                const res = await customerApi.search(customerInput);
                // Filter out results that are already in the local shop (to avoid duplicates in UI)
                const localIds = new Set(allCustomers.map(c => c._id));
                const uniqueGlobal = res.data.filter((c: any) => !localIds.has(c._id));
                setGlobalResults(uniqueGlobal);
            } catch (error) {
                console.error('Global search failed', error);
                setGlobalResults([]);
            } finally {
                setIsGlobalLoading(false);
            }
        };

        const timer = setTimeout(fetchGlobal, 400); // 400ms debounce
        return () => clearTimeout(timer);
    }, [customerInput, allCustomers]);

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

    const identifyCustomer = async (cust?: Customer) => {
        const phone = cust ? cust.phoneNumber : phoneNumber;
        const name = cust ? cust.name : customerName;

        if (phone.length !== 10 || !/^\d+$/.test(phone)) {
            addToast('Enter valid 10-digit phone number', 'error');
            return;
        }

        try {
            const response = await customerApi.create({ phoneNumber: phone, name });
            const customerData = response.data;

            // Sync with local Dexie DB for Khata Scoring
            let localCustomer = await db.customers.where('phoneNumber').equals(phone).first();
            if (!localCustomer) {
                const newLocalId = await db.customers.add({
                    phoneNumber: phone,
                    name: name || customerData.name || 'Unnamed Customer',
                    khataScore: SCORE_DEFAULT,
                    khataBalance: customerData.khataBalance || 0,
                    khataLimit: calculateKhataLimit(SCORE_DEFAULT),
                    activeKhataAmount: customerData.khataBalance || 0,
                    maxHistoricalKhataAmount: customerData.khataBalance || 0,
                    totalTransactions: 0,
                    khataTransactions: 0,
                    latePayments: 0,
                    createdAt: Date.now()
                });
                localCustomer = await db.customers.get(newLocalId);
            }

            setSelectedCustomer({
                ...customerData,
                ...localCustomer,
                name: customerData.name || localCustomer?.name || 'Unnamed Customer'
            } as Customer & LocalCustomer);

            // Get detailed Khata status
            const status = await getKhataStatus(phone);
            setKhataInfo(status);

            setCheckoutStep('PAYMENT');
            addToast(response.status === 201 ? 'New customer created' : 'Customer identified', 'success');
            loadCustomers(); // Refresh list
        } catch (e: any) {
            console.error(e);
            addToast('Error identifying customer', 'error');
        }
    };

    const filteredCustomers = allCustomers.filter(c =>
        (c.name?.toLowerCase().includes(customerInput.toLowerCase()) ||
            c.phoneNumber.includes(customerInput)) && customerInput.length > 0
    );

    const processTransaction = async (method: 'cash' | 'online' | 'ledger') => {
        if (!selectedCustomer) return false;

        try {
            // 1. Server Call
            await billApi.create({
                customerPhoneNumber: selectedCustomer.phoneNumber,
                items: cart.map(i => ({ productId: i._id!, quantity: i.quantity, price: i.price })),
                paymentType: method
            });

            // 2. Local Dexie Sync & Scroring Logic
            if (method === 'ledger') {
                const customer = await db.customers.where('phoneNumber').equals(selectedCustomer.phoneNumber).first();
                if (customer) {
                    const newActiveAmount = (customer.activeKhataAmount || 0) + cartTotal;
                    await db.customers.update(customer.id!, {
                        activeKhataAmount: newActiveAmount,
                        maxHistoricalKhataAmount: Math.max((customer.maxHistoricalKhataAmount || 0), newActiveAmount),
                        khataTransactions: (customer.khataTransactions || 0) + 1
                    });

                    // Add to local ledger for score calculation
                    await db.ledger.add({
                        customerId: selectedCustomer.phoneNumber,
                        amount: cartTotal,
                        paymentMode: 'KHATA',
                        type: 'debit',
                        status: 'PENDING',
                        createdAt: Date.now(),
                        items: cart
                    });

                    // Recalculate score
                    await recalculateKhataScore(selectedCustomer.phoneNumber);
                }
            } else {
                // For cash/online, just record it locally too
                await db.ledger.add({
                    customerId: selectedCustomer.phoneNumber,
                    amount: cartTotal,
                    paymentMode: method.toUpperCase() as any,
                    type: 'debit',
                    status: 'PAID',
                    createdAt: Date.now(),
                    paidAt: Date.now(),
                    items: cart
                });

                // Consistency check might still benefit from seeing any activity
                const customer = await db.customers.where('phoneNumber').equals(selectedCustomer.phoneNumber).first();
                if (customer) {
                    await db.customers.update(customer.id!, {
                        totalTransactions: (customer.totalTransactions || 0) + 1
                    });
                }
            }

            addToast('Transaction successful!', 'success');
            loadProducts();
            return true;
        } catch (e: any) {
            console.error(e);
            addToast(e.response?.data?.message || 'Transaction Failed', 'error');
            return false;
        }
    };

    const handleCashPayment = async () => {
        setAnimationType('cash');
        setShowStatusModal(true);
        setIsProcessing(true);

        const success = await processTransaction('cash');
        if (success) {
            setIsProcessing(false);
        } else {
            setShowStatusModal(false);
        }
    };

    const handleUpiPayment = async () => {
        setAnimationType('online');
        setShowStatusModal(true);
        setIsProcessing(true);

        const success = await processTransaction('online');
        if (success) {
            setIsProcessing(false);
        } else {
            setShowStatusModal(false);
        }
    };

    const handleLedgePayment = async () => {
        // Enforcement Rule: Check available limit
        if (khataInfo && cartTotal > khataInfo.availableCredit) {
            addToast(`Credit Limit Exceeded! Available: ₹${khataInfo.availableCredit}`, 'error');
            return;
        }

        setAnimationType('ledger');
        setShowStatusModal(true);
        setIsProcessing(true);

        const success = await processTransaction('ledger');
        if (success) {
            setIsProcessing(false);
            // No auto-close, wait for user to click OK
        } else {
            setShowStatusModal(false);
        }
    };

    const handleTransactionComplete = () => {
        clearCart();
        closeCheckout();
    };

    const closeCheckout = () => {
        setShowCheckout(false);
        setCheckoutStep('SUMMARY');
        setPaymentMethod(null);
        setShowStatusModal(false);
        setPhoneNumber('');
        setCustomerName('');
        setCustomerInput('');
        setIsNewCustomer(false);
        setSelectedCustomer(null);
        setAnimationType(null);
    };

    return (
        <div className="flex flex-col relative bg-gray-50 dark:bg-gray-900 min-h-full">
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
            <div className="p-4 pb-32">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {products?.filter(p =>
                        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.category.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(product => {
                        const isOutOfStock = product.stock <= 0;
                        return (
                            <button
                                key={product._id}
                                disabled={isOutOfStock}
                                onClick={() => {
                                    const success = addToCart(product, product.stock);
                                    if (!success) addToast(`Only ${product.stock} ${product.unit} available`, 'warning');
                                }}
                                className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center aspect-square transition-all relative overflow-hidden ${isOutOfStock ? 'opacity-40 grayscale-[0.5] cursor-not-allowed' : 'active:scale-95 hover:shadow-md'}`}
                            >
                                {isOutOfStock && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                        Sold Out
                                    </div>
                                )}
                                <div className="text-4xl mb-2">{product.icon || '📦'}</div>
                                <span className="font-bold text-gray-900 dark:text-gray-100 leading-tight block w-full text-center truncate">{product.name}</span>
                                <span className="text-primary-green font-bold text-sm mt-1">₹{product.price}/{product.unit}</span>
                                {product.stock <= product.minStock && product.stock > 0 && (
                                    <span className="text-xs text-danger-red font-semibold mt-1">Low Stock</span>
                                )}
                                {isOutOfStock && (
                                    <div className="absolute inset-0 bg-white/10 dark:bg-black/10 flex items-center justify-center">
                                        <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-lg rotate-[-15deg] shadow-lg ring-2 ring-white">OUT OF STOCK</div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sticky Order Button (if not in checkout) */}
            {!showCheckout && cart.length > 0 && (
                <div className="fixed bottom-24 left-4 right-4 md:bottom-6 md:left-72 md:right-8 z-40">
                    <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full bg-primary-green text-white p-4 rounded-2xl shadow-xl flex justify-between items-center animate-slide-up hover:shadow-2xl transition-all border border-white/10 backdrop-blur-md"
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
                                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 pr-3">
                                                <div className="flex items-center">
                                                    <button onClick={() => decreaseQuantity(item._id!)} className="w-8 h-8 bg-white dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-700 dark:text-white"><Minus size={16} /></button>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            const success = updateQuantity(item._id!, val, item.stock);
                                                            if (!success) addToast(`Only ${item.stock} ${item.unit} available`, 'warning');
                                                        }}
                                                        className="w-16 bg-transparent text-center font-bold text-gray-900 dark:text-white border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button onClick={() => {
                                                        const success = increaseQuantity(item._id!, item.stock);
                                                        if (!success) addToast(`Only ${item.stock} ${item.unit} available`, 'warning');
                                                    }} className="w-8 h-8 bg-white dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-700 dark:text-white"><Plus size={16} /></button>
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.unit}</span>
                                            </div>
                                            <button onClick={() => removeFromCart(item._id!)} className="text-danger-red p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={18} /></button>
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
                        <div className="flex-1 p-6 overflow-y-auto w-full max-w-xl mx-auto">
                            {!isNewCustomer ? (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="bg-primary-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <User className="text-primary-green" size={40} />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">Select Customer</h3>
                                        <p className="text-gray-500 dark:text-gray-400">Search by name or phone</p>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Type name or 10-digit phone..."
                                            value={customerInput}
                                            onChange={(e) => setCustomerInput(e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 py-4 px-12 rounded-2xl text-lg font-bold text-gray-900 dark:text-white outline-none focus:border-primary-green transition-all shadow-sm"
                                        />
                                    </div>

                                    {/* Quick Suggestions */}
                                    <div className="space-y-2">
                                        {/* Display Local Matches First */}
                                        {filteredCustomers.map(cust => (
                                            <button
                                                key={cust._id}
                                                onClick={() => identifyCustomer(cust)}
                                                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-primary-green hover:shadow-md transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center font-bold text-gray-500 uppercase">
                                                        {cust.name?.[0] || 'C'}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-black text-gray-900 dark:text-white">{cust.name || 'Unnamed Customer'}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-bold">+91 {cust.phoneNumber}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-gray-300 group-hover:text-primary-green" />
                                            </button>
                                        ))}

                                        {/* Display Global Matches */}
                                        {globalResults.map(cust => (
                                            <button
                                                key={cust._id}
                                                onClick={() => identifyCustomer(cust)}
                                                className="w-full flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 uppercase">
                                                        {cust.name?.[0] || 'C'}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-black text-gray-900 dark:text-white">{cust.name || 'Unnamed Customer'}</div>
                                                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">GLOBAL</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-bold">+91 {cust.phoneNumber}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-blue-300 group-hover:text-blue-500" />
                                            </button>
                                        ))}

                                        {isGlobalLoading && (
                                            <div className="text-center py-4 text-gray-400 text-sm animate-pulse">
                                                Searching globally...
                                            </div>
                                        )}

                                        {customerInput.length >= 3 && filteredCustomers.length === 0 && globalResults.length === 0 && !isGlobalLoading && (
                                            <div className="text-center py-6 text-gray-400">
                                                No results found for "{customerInput}"
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={() => {
                                                setIsNewCustomer(true);
                                                if (/^\d{10}$/.test(customerInput)) setPhoneNumber(customerInput);
                                                else setCustomerName(customerInput);
                                            }}
                                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <Plus size={20} /> Register New Customer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                                    <div className="text-center">
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">New Customer</h3>
                                        <p className="text-gray-500">Add to your shop network</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase ml-2 mb-1 block">Full Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Rahul Sharma"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 py-4 px-6 rounded-2xl text-xl font-bold text-gray-900 dark:text-white outline-none focus:border-primary-green transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase ml-2 mb-1 block">Phone Number</label>
                                            <input
                                                type="tel"
                                                placeholder="10-digit mobile"
                                                maxLength={10}
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 py-4 px-6 rounded-2xl text-xl font-bold text-gray-900 dark:text-white outline-none focus:border-primary-green transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => setIsNewCustomer(false)} className="flex-1 py-4 rounded-2xl font-black text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 transition-colors">Back</button>
                                        <button
                                            onClick={() => identifyCustomer()}
                                            disabled={phoneNumber.length !== 10 || !customerName}
                                            className={`flex-[2] py-4 rounded-2xl font-black text-lg shadow-lg transition-all ${phoneNumber.length === 10 && customerName ? 'bg-primary-green text-white shadow-green-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            Save & Pay
                                        </button>
                                    </div>
                                </div>
                            )}
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
                                        <div className="text-xs text-gray-500 font-medium">Digital Account</div>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl border-2 text-center ${getLedgerColor(selectedCustomer?.khataBalance || 0)}`}>
                                    <div className="text-xs uppercase font-bold">Dues</div>
                                    <div className="text-lg font-black font-mono">₹{selectedCustomer?.khataBalance || 0}</div>
                                </div>
                            </div>

                            {khataInfo && (
                                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary-green/5 to-primary-green/20 border border-primary-green/20">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <Award className="text-primary-green" size={20} />
                                            <span className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Khata Score</span>
                                        </div>
                                        <span className={`text-2xl font-black ${khataInfo.score >= 700 ? 'text-green-600' : khataInfo.score >= 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {khataInfo.score}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-bold">Available Credit:</span>
                                            <span className="font-black text-gray-900 dark:text-white">₹{khataInfo.availableCredit} / ₹{khataInfo.limit}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-green transition-all duration-500"
                                                style={{ width: `${(khataInfo.score - 300) / 600 * 100}%` }}
                                            />
                                        </div>
                                        {khataInfo.reasons.length > 0 && (
                                            <p className="text-[10px] text-gray-500 leading-tight italic mt-2">
                                                💡 {khataInfo.reasons[0]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!paymentMethod ? (
                                <div className="space-y-4">
                                    <button onClick={() => setPaymentMethod('cash')} className="w-full bg-green-600 text-white p-6 rounded-2xl font-bold text-xl flex items-center gap-4 shadow-lg"><span className="text-2xl">💵</span>CASH</button>
                                    <button onClick={() => setPaymentMethod('online')} className="w-full bg-purple-600 text-white p-6 rounded-2xl font-bold text-xl flex items-center gap-4 shadow-lg"><span className="text-2xl">📱</span>UPI (Online)</button>
                                    <button
                                        onClick={() => setPaymentMethod('ledger')}
                                        className="w-full bg-orange-500 text-white p-6 rounded-2xl font-bold text-xl flex items-center gap-4 shadow-lg relative overflow-hidden"
                                    >
                                        <span className="text-2xl">📒</span>LEDGE (Khata)
                                        {khataInfo && cartTotal > khataInfo.availableCredit && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-2">
                                                <ShieldAlert size={20} />
                                                <span className="text-xs uppercase font-black">Limit Exceeded</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 text-center">
                                    <div className="text-5xl font-black text-gray-900 dark:text-white mb-2">₹{cartTotal}</div>
                                    <div className="text-xs text-gray-400 font-bold uppercase mb-8">Payable via {paymentMethod === 'ledger' ? 'Khata' : paymentMethod}</div>

                                    {paymentMethod === 'ledger' && khataInfo && cartTotal > khataInfo.availableCredit ? (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/40 mb-4 animate-shake">
                                            <p className="text-red-600 dark:text-red-400 font-bold text-sm">₹{cartTotal} exceeds your available credit of ₹{khataInfo.availableCredit}</p>
                                        </div>
                                    ) : (
                                        <button onClick={paymentMethod === 'online' ? handleUpiPayment : paymentMethod === 'cash' ? handleCashPayment : handleLedgePayment} className="w-full bg-primary-green text-white p-5 rounded-2xl font-bold text-lg shadow-lg">Confirm {paymentMethod.toUpperCase()}</button>
                                    )}
                                    <button onClick={() => setPaymentMethod(null)} className="mt-4 text-gray-500 underline">Back</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showStatusModal && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
                    {/* Cash Flood Animation */}
                    {animationType === 'cash' && isProcessing && (
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-bounce text-4xl"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `-10%`,
                                        animationDuration: `${0.5 + Math.random() * 1.5}s`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        transform: `rotate(${Math.random() * 360}deg)`
                                    }}
                                >
                                    💵
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300 relative z-10">
                        {isProcessing ? (
                            <div className="space-y-6">
                                <div className="relative w-28 h-28 mx-auto">
                                    <div className={`absolute inset-0 border-8 ${animationType === 'online' ? 'border-purple-100 dark:border-purple-900' : animationType === 'cash' ? 'border-green-100 dark:border-green-900' : 'border-orange-100 dark:border-orange-900'} rounded-full`}></div>
                                    <div className={`absolute inset-0 border-8 ${animationType === 'online' ? 'border-purple-600' : animationType === 'cash' ? 'border-green-600' : 'border-orange-600'} border-t-transparent rounded-full animate-spin`}></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-4xl">
                                            {animationType === 'online' ? '📱' : animationType === 'cash' ? '💰' : '📒'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                                        {animationType === 'online' ? 'Verifying UPI...' : animationType === 'cash' ? 'Processing Cash...' : 'Updating Khata...'}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-bold italic">Processing Order...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in zoom-in duration-300">
                                <div className="w-28 h-28 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                                    <span className="text-6xl text-white">✓</span>
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Success!</h3>
                                <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Payment Received</p>

                                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                                    <div className="text-4xl font-black text-gray-900 dark:text-white">₹{cartTotal}</div>
                                    <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Total Amount Paid</div>
                                </div>

                                <button
                                    onClick={handleTransactionComplete}
                                    className="mt-8 w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-transform"
                                >
                                    OK, NEXT BILL
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
