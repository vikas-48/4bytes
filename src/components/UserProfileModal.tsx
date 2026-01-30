import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Trash2, AlertTriangle, Save, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, token, logout, login } = useAuth(); // login used to update user state locally if needed

    // Edit Mode State
    const [name, setName] = useState(user?.name || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
    const [loading, setLoading] = useState(false);

    // Delete Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.patch(
                'http://localhost:5000/api/auth/profile',
                { name, avatar: avatarUrl },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Ideally update local user context context here, usually by re-fetching or manually setting
            // Assuming useAuth exposes a way or we just reload
            // For now, let's just close and maybe reload the page or assume context updates on next fetch
            // But better to update context manually if possible. 
            // Since useAuth might not have a dedicated update function exposed, we might need to rely on re-login or reload
            // Or just update the local storage user object if that's how it's persisted

            // Quick fix: Update localStorage manually then window reload or just let the user see changes on refresh
            // But let's try to be cleaner. For MVP, window.location.reload() ensures strict sync.
            // Or just close.

            // Update local state if the auth context reads from something we can touch, 
            // but 'login' usually takes a token and user object.
            if (res.data) {
                // Assuming the login function updates the state
                // We can re-call login with the same token and new user data
                login(token!, res.data);
            }

            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        setError('');
        try {
            await axios.delete('http://localhost:5000/api/auth/delete-account', {
                data: { password },
                headers: { Authorization: `Bearer ${token}` }
            });
            logout();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete account');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <User size={20} className="text-primary-green" />
                                    User Profile
                                </h2>
                                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Profile Form */}
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="flex justify-center mb-6">
                                        <div className="relative group">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-700 shadow-md object-cover" />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-3xl font-bold border-4 border-white dark:border-gray-700 shadow-md">
                                                    {name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 focus:ring-2 focus:ring-primary-green focus:border-transparent outline-none transition-all"
                                            placeholder="Enter your name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Image URL</label>
                                        <div className="relative">
                                            <Camera size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                className="w-full pl-10 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 focus:ring-2 focus:ring-primary-green focus:border-transparent outline-none transition-all text-sm"
                                                placeholder="https://example.com/avatar.jpg"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-2 bg-primary-green hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        {loading ? 'Saving...' : 'Update Profile'}
                                    </button>
                                </form>

                                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                                {/* Delete Account Section */}
                                <div>
                                    <h3 className="text-red-600 font-semibold mb-2 flex items-center gap-2">
                                        <Trash2 size={16} />
                                        Danger Zone
                                    </h3>
                                    {!showDeleteConfirm && !showPasswordConfirm && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="w-full py-2 border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Delete My Account
                                        </button>
                                    )}

                                    {showDeleteConfirm && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30"
                                        >
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                                                <div>
                                                    <h4 className="text-sm font-bold text-red-700 dark:text-red-400">Are you absolutely sure?</h4>
                                                    <p className="text-xs text-red-600/80 mt-1 mb-3">
                                                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setShowDeleteConfirm(false)}
                                                            className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => { setShowDeleteConfirm(false); setShowPasswordConfirm(true); }}
                                                            className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                                                        >
                                                            Continue to Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {showPasswordConfirm && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Please enter your password to confirm deletion.
                                            </p>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                                placeholder="Your Password"
                                            />
                                            {error && <p className="text-xs text-red-500">{error}</p>}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowPasswordConfirm(false)}
                                                    className="flex-1 py-2 text-sm text-gray-600 dark:text-gray-400 hover:underline"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    disabled={loading || !password}
                                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {loading ? 'Deleting...' : 'Confirm Delete'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
