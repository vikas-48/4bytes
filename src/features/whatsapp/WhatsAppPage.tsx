

import WhatsAppLiveFeed from '../../components/WhatsAppLiveFeed';

const WhatsAppPage = () => {
    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <header className="px-6 pt-8 pb-4">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                    ShopOS Connect <span className="text-green-500">.</span>
                </h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                    Live Customer Conversations & AI Orders
                </p>
            </header>
            <WhatsAppLiveFeed />
        </div>
    );
};

export default WhatsAppPage;
