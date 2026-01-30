

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
                <button
                    onClick={() => {
                        fetch('http://localhost:5000/api/whatsapp/broadcast-reminders', { method: 'POST' })
                            .then(res => res.json())
                            .then(data => {
                                if (data.count === 0 && data.errors?.length === 0) {
                                    alert("⚠️ Simulation Mode: No Messages Sent.\n\nReason: Missing Twilio Credentials in server/.env file.\n\nPlease add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to enable real messages.");
                                } else if (data.errors?.length > 0) {
                                    alert(`❌ Error: Failed to send ${data.errors.length} messages.\nCheck console for details.`);
                                    console.error(data.errors);
                                } else {
                                    alert(`🚀 Reminders successfully sent to ${data.count} customers via WhatsApp!`);
                                }
                            })
                            .catch(err => {
                                console.error(err);
                                alert("Failed to connect to backend.");
                            });
                    }}
                    className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
                    </svg>
                    Send Due Reminders
                </button>
            </header>
            <WhatsAppLiveFeed />
        </div>
    );
};

export default WhatsAppPage;
