import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { db } from '../../db/db';
import type { Product } from '../../db/db';

export const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    minStock: '',
    category: '',
    icon: '📦'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const allProducts = await db.products.toArray();
    setProducts(allProducts);
  };

  const handleAddProduct = async () => {
    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    const minStock = parseInt(formData.minStock);

    if (!formData.name || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
      alert('Please fill all fields correctly');
      return;
    }

    const productData = {
      name: formData.name,
      price,
      stock,
      minStock: isNaN(minStock) ? 5 : minStock,
      category: formData.category,
      icon: formData.icon
    };

    if (editingId) {
      await db.products.update(editingId, {
        ...productData,
        updatedAt: Date.now(),
      });
    } else {
      await db.products.add({
        ...productData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    setFormData({ name: '', price: '', stock: '', minStock: '', category: '', icon: '📦' });
    setEditingId(null);
    setShowForm(false);
    loadProducts();
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = filteredProducts.filter(p => p.stock <= p.minStock);

  return (
    <div className="space-y-4 dark:text-gray-100">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Products</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', price: '', stock: '', minStock: '', category: '', icon: '📦' });
          }}
          className="bg-primary-green text-white p-3 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-3">
          <input
            type="text"
            placeholder="Product name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            placeholder="Stock quantity"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            placeholder="Minimum stock (reorder point)"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddProduct}
              className="flex-1 bg-primary-green text-white p-2 rounded-lg"
            >
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ name: '', price: '', stock: '', minStock: '', category: '', icon: '📦' });
              }}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 p-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 pl-10 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-warning-orange/10 border border-warning-orange text-warning-orange p-3 rounded-lg flex items-start gap-2">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">{lowStockProducts.length} products low on stock!</div>
            <div className="text-sm">{lowStockProducts.map(p => p.name).join(', ')}</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-2xl">{product.icon}</div>
                <div className="font-bold text-gray-800 dark:text-white">{product.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{product.category}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-primary-green">₹{product.price}</div>
                <div className={`text-sm ${product.stock <= product.minStock ? 'text-danger-red font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                  Stock: {product.stock}
                </div>
                <div className="text-xs text-gray-400">Min: {product.minStock}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
