import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Plus, X, Mic, Save } from 'lucide-react';

export const InventoryPage: React.FC = () => {
    const products = useLiveQuery(() => db.products.toArray());
    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: 'default' });

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price) return;
        await db.products.add({
            name: newProduct.name,
            price: parseFloat(newProduct.price),
            stock: parseInt(newProduct.stock) || 0,
            icon: 'default',
            category: newProduct.category
        });
        setIsAdding(false);
        setNewProduct({ name: '', price: '', stock: '', category: 'default' });
    };

    return (
        <div className="p-4 safe-area-bottom">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                    {products?.length || 0} Items
                </span>
            </div>

            {isAdding ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up border border-green-100">
                    <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-bold">Add Item</h3>
                        <button onClick={() => setIsAdding(false)}><X size={24} className="text-gray-400" /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Item Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-green-500 text-lg"
                                    placeholder="e.g. Potato 1kg"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                                <button className="absolute right-2 top-2 p-2 text-green-600 bg-white rounded-lg shadow-sm">
                                    <Mic size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Price (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-green-500 text-xl font-bold"
                                    placeholder="0"
                                    value={newProduct.price}
                                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Stock Qty</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-green-500 text-xl font-bold"
                                    placeholder="0"
                                    value={newProduct.stock}
                                    onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAddProduct}
                            className="w-full bg-primary-green text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mt-2 shadow-lg active:scale-95 transition-transform"
                        >
                            <Save size={20} />
                            Save Item
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full bg-white border-2 border-dashed border-primary-green text-primary-green p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mb-6 hover:bg-green-50 transition-colors"
                    >
                        <Plus size={24} />
                        Add New Item
                    </button>

                    <div className="space-y-3 pb-20">
                        {products?.map(product => (
                            <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                                        📦
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{product.name}</h4>
                                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-primary-green text-lg">₹{product.price}</span>
                                </div>
                            </div>
                        ))}

                        {products?.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <p>No items found.</p>
                                <p className="text-sm">Tap above to add one.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
