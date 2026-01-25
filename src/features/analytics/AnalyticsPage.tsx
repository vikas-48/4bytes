import React, { useState, useEffect } from 'react';
import { TrendingUp, User } from 'lucide-react';
import { db } from '../../db/db';
import type { Transaction, Customer } from '../../db/db';

export const AnalyticsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterDays, setFilterDays] = useState(30);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    avgTransaction: 0,
    topCustomer: null as Customer | null,
    topProduct: { name: '', count: 0 },
  });

  useEffect(() => {
    loadAnalytics();
  }, [filterDays]);

  const loadAnalytics = async () => {
    const cutoffDate = Date.now() - (filterDays * 24 * 60 * 60 * 1000);
    const allTransactions = await db.transactions.where('timestamp').above(cutoffDate).toArray();
    const saleTx = allTransactions.filter(t => t.type === 'SALE');
    const customers = await db.customers.toArray();

    setTransactions(saleTx);

    // Calculate stats
    const totalRevenue = saleTx.reduce((sum, tx) => sum + tx.amount, 0);
    const totalSales = saleTx.length;
    const avgTransaction = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top customer
    const customerSpendings: { [key: number]: number } = {};
    saleTx.forEach(tx => {
      if (tx.customerId) {
        customerSpendings[tx.customerId] = (customerSpendings[tx.customerId] || 0) + tx.amount;
      }
    });
    const topCustomerId = Object.entries(customerSpendings).sort(([, a], [, b]) => b - a)[0]?.[0];
    const topCustomer = topCustomerId ? customers.find(c => c.id === Number(topCustomerId)) || null : null;

    // Top product
    const productCounts: { [key: string]: number } = {};
    saleTx.forEach(tx => {
      tx.items.forEach(item => {
        productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
      });
    });
    const topProduct = Object.entries(productCounts).sort(([, a], [, b]) => b - a)[0];

    setStats({
      totalRevenue,
      totalSales,
      avgTransaction,
      topCustomer,
      topProduct: topProduct ? { name: topProduct[0], count: topProduct[1] } : { name: '', count: 0 },
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Sales Analytics</h2>

      <div className="flex gap-2">
        {[7, 30, 90, 365].map(days => (
          <button
            key={days}
            onClick={() => setFilterDays(days)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              filterDays === days
                ? 'bg-primary-green text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {days}d
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <TrendingUp size={14} /> Revenue
          </div>
          <div className="text-2xl font-bold text-primary-green">₹{stats.totalRevenue}</div>
          <div className="text-xs text-gray-500 mt-1">{stats.totalSales} sales</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Avg Transaction</div>
          <div className="text-2xl font-bold text-gray-800">₹{Math.round(stats.avgTransaction)}</div>
          <div className="text-xs text-gray-500 mt-1">per sale</div>
        </div>

        {stats.topCustomer && (
          <div className="bg-white p-4 rounded-lg shadow-sm col-span-2">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <User size={14} /> Top Customer
            </div>
            <div className="font-semibold text-gray-800">{stats.topCustomer.name}</div>
            <div className="text-sm text-primary-green">Spent ₹{Math.round(stats.topCustomer.totalPurchases)}</div>
          </div>
        )}

        {stats.topProduct.name && (
          <div className="bg-white p-4 rounded-lg shadow-sm col-span-2">
            <div className="text-xs text-gray-500">Top Product</div>
            <div className="font-semibold text-gray-800">{stats.topProduct.name}</div>
            <div className="text-sm text-primary-green">{stats.topProduct.count} units sold</div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Recent Transactions</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {transactions.slice(-10).reverse().map((tx) => (
            <div key={tx.id} className="text-sm border-b border-gray-100 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-800">{tx.items.map(i => i.name).join(', ')}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-semibold text-primary-green">₹{tx.amount}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
