import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Product } from '../db/db';

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
<<<<<<< HEAD
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    increaseQuantity: (productId: string) => void;
=======
    addToCart: (product: Product, currentStock: number) => boolean;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number, currentStock: number) => boolean;
    increaseQuantity: (productId: string, currentStock: number) => boolean;
>>>>>>> origin/main
    decreaseQuantity: (productId: string) => void;
    clearCart: () => void;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = (product: Product, currentStock: number) => {
        let success = true;
        setCart(prev => {
            const existing = prev.find(p => p._id === product._id);
            if (existing) {
<<<<<<< HEAD
                return prev.map(p => p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p);
=======
                if (existing.quantity + 1 > currentStock) {
                    success = false;
                    return prev;
                }
                return prev.map(p => p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            if (currentStock <= 0) {
                success = false;
                return prev;
>>>>>>> origin/main
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        return success;
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(p => p._id !== productId));
    };

<<<<<<< HEAD
    const updateQuantity = (productId: string, quantity: number) => {
=======
    const updateQuantity = (productId: string, quantity: number, currentStock: number) => {
>>>>>>> origin/main
        if (quantity <= 0) {
            removeFromCart(productId);
            return true;
        }
<<<<<<< HEAD
        setCart(prev => prev.map(p => p._id === productId ? { ...p, quantity } : p));
    };

    const increaseQuantity = (productId: string) => {
        setCart(prev => prev.map(p => p._id === productId ? { ...p, quantity: p.quantity + 1 } : p));
    };

    const decreaseQuantity = (productId: string) => {
        setCart(prev => {
            return prev.map(p => {
                if (p._id === productId) {
                    const newQuantity = p.quantity - 1;
                    return newQuantity > 0 ? { ...p, quantity: newQuantity } : p;
=======
        if (quantity > currentStock) {
            return false;
        }
        setCart(prev => prev.map(p => p._id === productId ? { ...p, quantity } : p));
        return true;
    };

    const increaseQuantity = (productId: string, currentStock: number) => {
        let success = true;
        setCart(prev => {
            return prev.map(p => {
                if (p._id === productId) {
                    if (p.quantity + 1 > currentStock) {
                        success = false;
                        return p;
                    }
                    return { ...p, quantity: p.quantity + 1 };
>>>>>>> origin/main
                }
                return p;
            });
        });
        return success;
    };

    const decreaseQuantity = (productId: string) => {
        setCart(prev => prev.map(p =>
            p._id === productId ? { ...p, quantity: p.quantity - 1 } : p
        ).filter(p => p.quantity > 0));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, increaseQuantity, decreaseQuantity, clearCart, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
