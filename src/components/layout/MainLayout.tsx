import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Store, Users, Package, TrendingUp, CreditCard, ShoppingCart, Menu, X, Moon, Sun, Gift, BookOpen, LogOut, Phone, MessageSquare } from 'lucide-react';
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
        { path: '/whatsapp', label: 'ShopOS WA 🟢', icon: MessageSquare },
        { path: '/recovery', label: 'AI Agent 🤖', icon: Phone },
        { path: '/products', label: t.products, icon: Package },
        { path: '/khata', label: t.khata, icon: CreditCard },
        { path: '/inventory', label: t.inventory, icon: ShoppingCart },
        { path: '/payments', label: t.payments, icon: CreditCard },
        { path: '/ledger', label: 'Ledger', icon: BookOpen },
        { path: '/analytics', label: t.analytics, icon: TrendingUp },
    ];

    return (
        <div className={`min-h-screen flex ${darkMode ? 'dark bg-[#0A0A0A] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col w-64 fixed inset-y-0 z-50 ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-gray-200'} border-r transition-all duration-300`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-green/20">
                        <Store size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter">GraminLink</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">MSME Ecosystem</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${isActive
                                        ? 'bg-primary-green text-white shadow-lg shadow-primary-green/20 scale-105'
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`
                                }
                            >
                                <Icon size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm text-gray-700 dark:text-gray-200 group-hover:dark:text-white transition-colors">
                                    {link.label}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-green to-emerald-400 flex items-center justify-center text-white font-bold">
                            {user?.name?.[0] || 'K'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black truncate">{user?.name || 'Owner'}</p>
                            <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-[10px] text-gray-500 font-bold">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`flex-1 p-2.5 rounded-xl border transition-all ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-red-100 dark:border-red-500/20"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="flex-1 flex flex-col md:pl-64">
                <header className={`md:hidden sticky top-0 z-40 w-full ${darkMode ? 'bg-[#0A0A0A]/80 border-white/5' : 'bg-white/80 border-gray-200'} backdrop-blur-md border-b px-4 py-3 flex justify-between items-center`}>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-green rounded-xl flex items-center justify-center text-white">
                            <Store size={18} />
                        </div>
                        <span className="font-black tracking-tight">GraminLink</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-xl border border-gray-100 dark:border-white/5"
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-xl bg-gray-50 dark:bg-white/5"
                        >
                            {showMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </header>

                {/* Mobile Drawer Overlay */}
                {showMenu && (
                    <div className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowMenu(false)}>
                        <div className={`absolute left-0 top-0 bottom-0 w-80 ${darkMode ? 'bg-[#0A0A0A]' : 'bg-white'} p-6 shadow-2xl animate-in slide-in-from-left duration-300`} onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black">Menu</h2>
                                <button onClick={() => setShowMenu(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 font-bold"><X size={24} /></button>
                            </div>
                            <nav className="space-y-2">
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    return (
                                        <NavLink
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => setShowMenu(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${isActive
                                                    ? 'bg-primary-green text-white shadow-xl translate-x-2'
                                                    : 'text-gray-500 hover:bg-gray-50'
                                                }`
                                            }
                                        >
                                            <Icon size={22} />
                                            <span className="font-bold">{link.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </nav>

                            <div className="absolute bottom-10 left-6 right-6 p-4 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary-green flex items-center justify-center text-white text-xl font-bold">{user?.name?.[0] || 'K'}</div>
                                    <div>
                                        <p className="font-black">{user?.name || 'Owner'}</p>
                                        <p className="text-xs text-gray-500 font-bold">Manage Account</p>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="w-full bg-red-500/10 text-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-2">
                                    <LogOut size={18} /> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8">
                        <Outlet />
                    </div>
                </main>

                {/* Bottom Navigation (Mobile Only) */}
                <nav className={`md:hidden fixed bottom-6 left-6 right-6 z-50 h-16 ${darkMode ? 'bg-[#111111]/80 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-[2rem] flex justify-around items-center px-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)]`}>
                    {navLinks.slice(0, 4).map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) =>
                                    `relative flex flex-col items-center justify-center transition-all ${isActive
                                        ? 'text-primary-green'
                                        : 'text-gray-400'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon size={24} className={isActive ? 'scale-110 -translate-y-1' : ''} />
                                        {isActive && <div className="absolute -bottom-2 w-1 h-1 bg-primary-green rounded-full" />}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};
