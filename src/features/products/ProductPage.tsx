import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { productApi } from '../../services/api';

interface Product {
  _id?: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  icon: string;
  unit: string;
}

export const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: 0, stock: 0, minStock: 5, category: '', icon: '📦', unit: 'piece' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productApi.getAll();
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  const handleAddProduct = async () => {
    if (!formData.name || formData.price <= 0 || formData.stock < 0) {
      alert('Please fill all fields correctly');
      return;
    }

    try {
      if (editingId) {
        await productApi.update(editingId, formData);
      } else {
        await productApi.create(formData);
      }
      setFormData({ name: '', price: 0, stock: 0, minStock: 5, category: '', icon: '📦', unit: 'piece' });
      setEditingId(null);
      setShowForm(false);
      loadProducts();
    } catch (err) {
      console.error('Failed to save product', err);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = filteredProducts.filter(p => p.stock <= p.minStock);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Products (Sync: MongoDB)</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', price: 0, stock: 0, minStock: 5, category: '', icon: '📦', unit: 'piece' });
          }}
          className="bg-primary-green text-white p-3 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
          <input
            type="text"
            placeholder="Product name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
          <input
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
          <input
            type="number"
            placeholder="Stock quantity"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
          <input
            type="number"
            placeholder="Minimum stock (reorder point)"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full border border-gray-300 rounded-lg p-2"
          >
            <option value="piece">Piece</option>
            <option value="packet">Packet</option>
            <option value="kg">Kg</option>
            <option value="g">Gram</option>
            <option value="100g">100g</option>
            <option value="litre">Litre</option>
          </select>
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
                setFormData({ name: '', price: 0, stock: 0, minStock: 5, category: '', icon: '📦', unit: 'piece' });
              }}
              className="flex-1 bg-gray-300 text-gray-700 p-2 rounded-lg"
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
          className="w-full border border-gray-300 rounded-lg p-2 pl-10"
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
          <div key={product._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer" onClick={() => {
            setEditingId(product._id!);
            setFormData({
              name: product.name,
              price: product.price,
              stock: product.stock,
              minStock: product.minStock,
              category: product.category,
              icon: product.icon,
              unit: product.unit
            });
            setShowForm(true);
          }}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-2xl">{product.icon}</div>
                <div className="font-bold text-gray-800">{product.name}</div>
                <div className="text-sm text-gray-500">{product.category}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-primary-green">₹{product.price}/{product.unit}</div>
                <div className={`text-sm ${product.stock <= product.minStock ? 'text-danger-red font-semibold' : 'text-gray-600'}`}>
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
