import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Store, Users, Package, TrendingUp, CreditCard, ShoppingCart, Menu, X, Moon, Sun, Globe } from 'lucide-react';

export const MainLayout: React.FC = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState<'en' | 'hi'>('en');

    const navLinks = [
        { path: '/', label: darkMode ? 'बिलिंग' : 'Billing', icon: Store },
        { path: '/customers', label: darkMode ? 'ग्राहक' : 'Customers', icon: Users },
        { path: '/products', label: darkMode ? 'उत्पाद' : 'Products', icon: Package },
        { path: '/khata', label: darkMode ? 'खाता' : 'Khata', icon: CreditCard },
        { path: '/inventory', label: darkMode ? 'इन्वेंटरी' : 'Stock', icon: ShoppingCart },
        { path: '/payments', label: darkMode ? 'भुगतान' : 'Payments', icon: CreditCard },
        { path: '/analytics', label: darkMode ? 'विश्लेषण' : 'Analytics', icon: TrendingUp },
    ];

    return (
        <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <header className={`${darkMode ? 'bg-gray-800' : 'bg-primary-green'} text-white p-4 shadow-md z-10 sticky top-0`}>
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold">GraminLink</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 hover:bg-white/20 rounded-lg"
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                            className="p-2 hover:bg-white/20 rounded-lg text-sm font-medium"
                            title="Toggle Language"
                        >
                            {language === 'en' ? 'HI' : 'EN'}
                        </button>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-white/20 rounded-lg"
                        >
                            {showMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {showMenu && (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b border-gray-200 max-h-96 overflow-y-auto z-30`}>
                    <div className="p-4 space-y-2">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setShowMenu(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                            isActive
                                                ? `${darkMode ? 'bg-primary-green' : 'bg-primary-green'} text-white`
                                                : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
                                        }`
                                    }
                                >
                                    <Icon size={20} />
                                    <span>{link.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto p-4 pb-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className={`fixed bottom-0 w-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t flex justify-around py-2 pb-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20 overflow-x-auto`}>
                {navLinks.slice(0, 4).map((link) => {
                    const Icon = link.icon;
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center p-2 rounded-lg transition-colors whitespace-nowrap ${isActive ? 'text-primary-green' : darkMode ? 'text-gray-400' : 'text-gray-500'}`
                            }
                        >
                            <Icon size={28} />
                            <span className="text-xs font-medium mt-1">{link.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
};
