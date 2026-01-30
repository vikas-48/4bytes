import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Product } from '../db/db';

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    increaseQuantity: (productId: string) => void;
    decreaseQuantity: (productId: string) => void;
    clearCart: () => void;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p._id === product._id);
            if (existing) {
                return prev.map(p => p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(p => p._id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
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
                }
                return p;
            }).filter(p => p.quantity > 0);
        });
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
