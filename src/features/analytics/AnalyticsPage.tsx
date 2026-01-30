import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { billApi } from '../../services/api';

export const AnalyticsPage: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [filterDays] = useState(30);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    avgTransaction: 0,
    topProduct: { name: '', count: 0 },
  });

  useEffect(() => {
    loadAnalytics();
  }, [filterDays]);

  const loadAnalytics = async () => {
    try {
      const response = await billApi.getAll();
      const allBills = response.data;
      setBills(allBills);

      const totalRevenue = allBills.reduce((sum: number, b: any) => sum + b.totalAmount, 0);
      const totalSales = allBills.length;
      const avgTransaction = totalSales > 0 ? totalRevenue / totalSales : 0;

      const productCounts: { [key: string]: number } = {};
      allBills.forEach((b: any) => {
        b.items.forEach((item: any) => {
          productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
        });
      });
      const topProductEntry = Object.entries(productCounts).sort(([, a], [, b]) => b - a)[0];

      setStats({
        totalRevenue,
        totalSales,
        avgTransaction,
        topProduct: topProductEntry ? { name: topProductEntry[0], count: topProductEntry[1] } : { name: '', count: 0 },
      });
    } catch (err) {
      console.error('Failed to load analytics', err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <TrendingUp size={14} /> Revenue
          </div>
          <div className="text-2xl font-bold text-primary-green">₹{stats.totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">{stats.totalSales} sales logged</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Basket Size</div>
          <div className="text-2xl font-bold text-gray-800">₹{Math.round(stats.avgTransaction)}</div>
          <div className="text-xs text-gray-500 mt-1">avg/bill</div>
        </div>

        {stats.topProduct.name && (
          <div className="bg-white p-4 rounded-lg shadow-sm col-span-2">
            <div className="text-xs text-gray-500">Bestseller</div>
            <div className="font-semibold text-gray-800">{stats.topProduct.name}</div>
            <div className="text-sm text-primary-green">{stats.topProduct.count} units sold</div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Recent Transactions</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {bills.slice().reverse().map((b: any) => (
            <div key={b._id} className="text-xs border-b pb-2 flex justify-between">
              <div>
                <div className="font-bold">{b.items.map((i: any) => i.name).join(', ')}</div>
                <div className="text-gray-400">{new Date(b.createdAt).toLocaleString()}</div>
              </div>
              <div className="font-black text-primary-green">₹{b.totalAmount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
