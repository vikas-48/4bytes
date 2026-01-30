import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, NavLink } from 'react-router-dom';
import { Store, Users, Package, TrendingUp, CreditCard, ShoppingCart, Menu, X, Moon, Sun, WifiOff, Gift, BookOpen, LogOut } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import { UserProfileModal } from '../UserProfileModal';

export const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { t } = useLanguage();

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode.toString());
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const navLinks = [
        { path: '/', label: t.billing, icon: Store },
        { path: '/deals', label: 'Group Buy', icon: Gift },
        { path: '/customers', label: t.customers, icon: Users },
        { path: '/products', label: t.products, icon: Package },
        { path: '/khata', label: t.khata, icon: CreditCard },
        { path: '/inventory', label: t.inventory, icon: ShoppingCart },
        { path: '/payments', label: t.payments, icon: CreditCard },
        { path: '/records', label: 'Records', icon: BookOpen },
        { path: '/analytics', label: t.analytics, icon: TrendingUp },
    ];

    return (
        <div className={`h-screen flex flex-col ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-primary-green'} text-white p-4 shadow-md z-10 sticky top-0 border-b`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="relative group focus:outline-none"
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} className="w-9 h-9 rounded-full border-2 border-white/30 group-hover:border-white transition-colors object-cover" alt="Profile" />
                            ) : (
                                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs uppercase border-2 border-transparent group-hover:border-white/50 transition-all">
                                    {user?.name?.[0] || 'S'}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 text-primary-green rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <Users size={10} />
                            </div>
                        </button>
                        <div>
                            <h1 className="text-lg font-bold leading-none tracking-tight">KiranaLink</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isOnline && (
                            <div className="flex items-center gap-1 text-warning-orange text-xs px-2 py-1 rounded-lg bg-white/10">
                                <WifiOff size={16} />
                                <span>Offline</span>
                            </div>
                        )}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            {showMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

            {/* Mobile Menu Modal */}
            <AnimatePresence>
                {showMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMenu(false)}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className={`fixed z-50 top-20 right-4 w-64 rounded-2xl shadow-2xl overflow-hidden border ${darkMode
                                ? 'bg-gray-800/90 border-gray-700 text-gray-100'
                                : 'bg-white/90 border-gray-200 text-gray-900'
                                }`}
                        >
                            <div className="p-4 border-b border-gray-200/10 flex justify-between items-center">
                                <h3 className="font-semibold text-sm uppercase tracking-wider opacity-70">Menu</h3>
                                <button
                                    onClick={() => setShowMenu(false)}
                                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
                                {navLinks.slice(4).map((link) => {
                                    const Icon = link.icon;
                                    return (
                                        <NavLink
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => setShowMenu(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive
                                                    ? 'bg-primary-green text-white font-semibold shadow-md'
                                                    : darkMode
                                                        ? 'text-gray-300 hover:bg-gray-700/50 hover:pl-4'
                                                        : 'text-gray-700 hover:bg-gray-100 hover:pl-4'
                                                }`
                                            }
                                        >
                                            <Icon size={20} className={link.path === '/deals' ? 'text-purple-500' : ''} />
                                            <span>{link.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`relative w-full max-w-sm rounded-[2rem] p-8 shadow-2xl overflow-hidden border ${darkMode
                                ? 'bg-gray-800 border-gray-700 text-gray-100'
                                : 'bg-white border-gray-100 text-gray-900'
                                }`}
                        >
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-600">
                                    <LogOut size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black">Are you sure?</h3>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                        You are about to log out from <span className="font-bold text-gray-900 dark:text-white">KiranaLink</span>. You will need to login again to manage your shop.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 pt-4">
                                    <button
                                        onClick={confirmLogout}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-[0.98]"
                                    >
                                        Yes, Log Out
                                    </button>
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-4 rounded-2xl font-bold text-gray-600 dark:text-gray-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto p-4 pb-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className={`fixed bottom-0 w-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t flex justify-around py-2 pb-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-20 overflow-x-auto`}>
                {navLinks.slice(0, 4).map((link) => {
                    const Icon = link.icon;
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center p-2 rounded-lg transition-colors whitespace-nowrap ${isActive
                                    ? 'text-primary-green'
                                    : darkMode
                                        ? 'text-gray-400 hover:text-gray-300'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`
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
