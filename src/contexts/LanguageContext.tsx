import React, { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'en' | 'hi' | 'te';

type Translations = {
    [key in Language]: {
        // Navigation
        billing: string;
        customers: string;
        products: string;
        khata: string;
        inventory: string;
        payments: string;
        analytics: string;
        toggleTitle: string;

        // Common
        add: string;
        save: string;
        cancel: string;
        search: string;

        // Billing / Cart
        tapToAdd: string;
        total: string;
        checkout: string;
        viewCart: string;
        grandTotal: string;
        proceedToPay: string;
        orderSummary: string;
        paymentMethod: string;
        confirm: string;

        // Customers / Khata
        name: string;
        phone: string;
        balance: string;
        dueBalance: string;
        trust: string;
        visits: string;
        settle: string;
        enterAmount: string;
        pay: string;
        transactionHistory: string;
        noTransactions: string;
        khataPayment: string;

        // Inventory
        itemName: string;
        itemPrice: string;
        stockQty: string;
        addItem: string;
        saveItem: string;
        noItems: string;

        // ... add more as needed
    }
};

const translations: Translations = {
    en: {
        billing: 'Billing',
        customers: 'Customers',
        products: 'Products',
        khata: 'Khata',
        inventory: 'Stock',
        payments: 'Payments',
        analytics: 'Analytics',
        toggleTitle: 'Toggle Language',
        add: 'Add',
        save: 'Save',
        cancel: 'Cancel',
        search: 'Search...',
        tapToAdd: 'Tap to Add',
        total: 'TOTAL',
        checkout: 'Checkout',
        viewCart: 'View Cart',
        grandTotal: 'Grand Total',
        proceedToPay: 'Proceed to Pay',
        orderSummary: 'Order Summary',
        paymentMethod: 'Payment Method',
        confirm: 'Confirm',
        name: 'Name',
        phone: 'Phone Number',
        balance: 'Balance',
        dueBalance: 'Due Balance',
        trust: 'Trust',
        visits: 'Visits',
        settle: 'Settle',
        enterAmount: 'Enter Amount',
        pay: 'Pay',
        transactionHistory: 'Transaction History',
        noTransactions: 'No transactions yet',
        khataPayment: 'KHATA PAYMENT',
        itemName: 'Item Name',
        itemPrice: 'Price (₹)',
        stockQty: 'Stock Qty',
        addItem: 'Add Item',
        saveItem: 'Save Item',
        noItems: 'No items found',
    },
    hi: {
        billing: 'बिलिंग',
        customers: 'ग्राहक',
        products: 'उत्पाद',
        khata: 'खाता',
        inventory: 'इन्वेंटरी',
        payments: 'भुगतान',
        analytics: 'विश्लेषण',
        toggleTitle: 'भाषा बदलें',
        add: 'जोड़ें',
        save: 'सहेजें',
        cancel: 'रद्द करें',
        search: 'खोजें...',
        tapToAdd: 'जोड़ने के लिए टैप करें',
        total: 'कुल',
        checkout: 'चेकआउट',
        viewCart: 'कार्ट देखें',
        grandTotal: 'कुल योग',
        proceedToPay: 'भुगतान करें',
        orderSummary: 'ऑर्डर सारांश',
        paymentMethod: 'भुगतान विधि',
        confirm: 'पुष्टि करें',
        name: 'नाम',
        phone: 'फ़ोन नंबर',
        balance: 'शेष',
        dueBalance: 'बकाया राशि',
        trust: 'विश्वास',
        visits: 'विज़िट',
        settle: 'निपटाएं',
        enterAmount: 'राशि दर्ज करें',
        pay: 'भुगतान',
        transactionHistory: 'लेनदेन इतिहास',
        noTransactions: 'कोई लेनदेन नहीं',
        khataPayment: 'खाता भुगतान',
        itemName: 'वस्तु का नाम',
        itemPrice: 'कीमत (₹)',
        stockQty: 'स्टॉक मात्रा',
        addItem: 'वस्तु जोड़ें',
        saveItem: 'वस्तु सहेजें',
        noItems: 'कोई वस्तु नहीं मिली',
    },
    te: {
        billing: 'బిల్లింగ్',
        customers: 'ఖాతాదారులు',
        products: 'సరుకులు',
        khata: 'ఖాతా',
        inventory: 'ఇన్వెంటరీ',
        payments: 'చెల్లింపులు',
        analytics: 'విశ్లేషణ',
        toggleTitle: 'భాష మార్చండి',
        add: 'జోడించు',
        save: 'సేవ్',
        cancel: 'రద్దు',
        search: 'వెతకండి...',
        tapToAdd: 'జోడించడానికి నొక్కండి',
        total: 'మొత్తం',
        checkout: 'చెక్అవుట్',
        viewCart: 'కార్ట్ చూడండి',
        grandTotal: 'మొత్తం ధర',
        proceedToPay: 'చెల్లించండి',
        orderSummary: 'ఆర్డర్ వివరాలు',
        paymentMethod: 'చెల్లింపు పద్ధతి',
        confirm: 'నిర్ధారించండి',
        name: 'పేరు',
        phone: 'ఫోన్ నంబర్',
        balance: 'బ్యాలెన్స్',
        dueBalance: 'బాకీ మొత్తం',
        trust: 'నమ్మకం',
        visits: 'సందర్శనలు',
        settle: 'సెటిల్ చేయండి',
        enterAmount: 'మొత్తాన్ని నమోదు చేయండి',
        pay: 'చెల్లించు',
        transactionHistory: 'లావాదేవీ చరిత్ర',
        noTransactions: 'లావాదేవీలు లేవు',
        khataPayment: 'ఖాతా చెల్లింపు',
        itemName: 'వస్తువు పేరు',
        itemPrice: 'ధర (₹)',
        stockQty: 'స్టాక్ పరిమాణం',
        addItem: 'వస్తువును జోడించు',
        saveItem: 'వస్తువును సేవ్ చేయి',
        noItems: 'వస్తువులు కనుగొనబడలేదు',
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations['en'];
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    const toggleLanguage = () => {
        setLanguage(prev => {
            if (prev === 'en') return 'hi';
            if (prev === 'hi') return 'te';
            return 'en';
        });
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t: translations[language], toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
    return context;
};
