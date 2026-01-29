import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Store, Users, Package, TrendingUp, CreditCard, ShoppingCart, Menu, X, Moon, Sun, WifiOff, Gift, BookOpen, LogOut } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { t } = useLanguage();

    const handleLogout = () => {
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
        { path: '/ledger', label: 'Ledger', icon: BookOpen },
        { path: '/analytics', label: t.analytics, icon: TrendingUp },
    ];

    return (
        <div className={`h-screen flex flex-col ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-primary-green'} text-white p-4 shadow-md z-10 sticky top-0 border-b`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {user?.avatar ? (
                            <img src={user.avatar} className="w-8 h-8 rounded-full border border-white/20" alt="Avatar" />
                        ) : (
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                                {user?.name?.[0] || 'S'}
                            </div>
                        )}
                        <div>
                            <h1 className="text-sm font-bold leading-none">KiranaLink</h1>
                            <p className="text-[10px] opacity-70 font-medium">{user?.name}</p>
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

            {/* Mobile Menu */}
            {showMenu && (
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-b max-h-96 overflow-y-auto z-30`}>
                    <div className="p-4 space-y-2">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setShowMenu(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive
                                            ? 'bg-primary-green text-white font-semibold'
                                            : darkMode
                                                ? 'text-gray-300 hover:bg-gray-700'
                                                : 'text-gray-700 hover:bg-gray-100'
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
