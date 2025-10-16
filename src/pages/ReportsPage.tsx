import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, TrendingUp, Users, DollarSign } from 'lucide-react';

interface FarmerBalance {
  farmer_id: number;
  farmer_name: string;
  total_debit: number;
  total_credit: number;
  balance: number;
}

interface MonthlyData {
  month: string;
  purchases: number;
  sales: number;
  profit: number;
}

export function ReportsPage() {
  const [farmerBalances, setFarmerBalances] = useState<FarmerBalance[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSales: 0,
    totalProfit: 0,
    totalCommission: 0,
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);

    const [purchasesRes, salesRes, balancesRes] = await Promise.all([
      supabase.from('purchases').select('total_amount, date'),
      supabase.from('crop_sales').select('total_value, commission_amount, date'),
      supabase.rpc('get_farmer_balances').select('*'),
    ]);

    if (purchasesRes.data && salesRes.data) {
      const totalPurchases = purchasesRes.data.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
      const totalSales = salesRes.data.reduce((sum, s) => sum + (Number(s.total_value) || 0), 0);
      const totalCommission = salesRes.data.reduce((sum, s) => sum + (Number(s.commission_amount) || 0), 0);

      setStats({
        totalPurchases,
        totalSales,
        totalProfit: totalSales - totalPurchases,
        totalCommission,
      });

      const monthlyMap = new Map<string, MonthlyData>();

      purchasesRes.data.forEach((p) => {
        if (p.date) {
          const month = new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          const existing = monthlyMap.get(month) || { month, purchases: 0, sales: 0, profit: 0 };
          existing.purchases += Number(p.total_amount) || 0;
          monthlyMap.set(month, existing);
        }
      });

      salesRes.data.forEach((s) => {
        if (s.date) {
          const month = new Date(s.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          const existing = monthlyMap.get(month) || { month, purchases: 0, sales: 0, profit: 0 };
          existing.sales += Number(s.total_value) || 0;
          monthlyMap.set(month, existing);
        }
      });

      const monthlyArray = Array.from(monthlyMap.values()).map(m => ({
        ...m,
        profit: m.sales - m.purchases,
      }));

      setMonthlyData(monthlyArray);
    }

    if (balancesRes.error) {
      const { data } = await supabase.from('farmer_balances').select('*');
      if (data) {
        setFarmerBalances(data.map(b => ({
          farmer_id: b.farmer_id || 0,
          farmer_name: b.farmer_name || '',
          total_debit: Number(b.total_debit) || 0,
          total_credit: Number(b.total_credit) || 0,
          balance: Number(b.balance) || 0,
        })));
      }
    } else if (balancesRes.data) {
      setFarmerBalances(balancesRes.data);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Financial overview and farmer balances</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                Rs. {stats.totalPurchases.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                Rs. {stats.totalSales.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold mt-2 ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs. {stats.totalProfit.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commission</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                Rs. {stats.totalCommission.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <Users className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h2>
          {monthlyData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No monthly data available</p>
          ) : (
            <div className="space-y-3">
              {monthlyData.slice(0, 6).map((data) => (
                <div key={data.month} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{data.month}</span>
                    <span className={`font-semibold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Rs. {data.profit.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Purchases:</span>
                      <span className="ml-2 text-gray-900">Rs. {data.purchases.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sales:</span>
                      <span className="ml-2 text-gray-900">Rs. {data.sales.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Farmer Balances</h2>
          {farmerBalances.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No farmer balances available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {farmerBalances.slice(0, 10).map((balance) => (
                    <tr key={balance.farmer_id}>
                      <td className="px-3 py-3 text-sm text-gray-900">{balance.farmer_name}</td>
                      <td className={`px-3 py-3 text-sm text-right font-medium ${
                        balance.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Rs. {balance.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <p className="text-blue-100 text-sm">Gross Revenue</p>
            <p className="text-3xl font-bold mt-1">Rs. {stats.totalSales.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Total Expenses</p>
            <p className="text-3xl font-bold mt-1">Rs. {stats.totalPurchases.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Net Income</p>
            <p className="text-3xl font-bold mt-1">Rs. {stats.totalProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
