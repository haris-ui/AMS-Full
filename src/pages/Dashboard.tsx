import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Package, ShoppingCart, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface Stats {
  totalFarmers: number;
  totalProducts: number;
  totalPurchases: number;
  totalSales: number;
  totalPurchaseAmount: number;
  totalSalesAmount: number;
}

interface RecentActivity {
  id: number;
  action: string;
  description: string;
  created_at: string;
}

export function Dashboard() {
  const { profile, role } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalFarmers: 0,
    totalProducts: 0,
    totalPurchases: 0,
    totalSales: 0,
    totalPurchaseAmount: 0,
    totalSalesAmount: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [farmersRes, productsRes, purchasesRes, salesRes, activityRes] = await Promise.all([
        supabase.from('farmers').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('purchases').select('id, total_amount'),
        supabase.from('crop_sales').select('id, total_value'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const purchaseAmount = purchasesRes.data?.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0) || 0;
      const salesAmount = salesRes.data?.reduce((sum, s) => sum + (Number(s.total_value) || 0), 0) || 0;

      setStats({
        totalFarmers: farmersRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalPurchases: purchasesRes.data?.length || 0,
        totalSales: salesRes.data?.length || 0,
        totalPurchaseAmount: purchaseAmount,
        totalSalesAmount: salesAmount,
      });

      setRecentActivity(activityRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      alert('Error loading dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Farmers',
      value: stats.totalFarmers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Purchases',
      value: stats.totalPurchases,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Sales',
      value: stats.totalSales,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {profile?.full_name || 'User'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={card.textColor} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 p-2 rounded-lg">
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Financial Overview</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Total Purchases</span>
              <span className="text-xl font-bold text-gray-900">
                Rs. {stats.totalPurchaseAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Total Sales</span>
              <span className="text-xl font-bold text-gray-900">
                Rs. {stats.totalSalesAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-700 font-medium">Net Margin</span>
              <span className="text-xl font-bold text-green-700">
                Rs. {(stats.totalSalesAmount - stats.totalPurchaseAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Activity className="text-purple-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  {activity.description && (
                    <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Quick Actions</h2>
        <p className="text-blue-100 mb-6">
          Get started by managing your farmers, products, and transactions
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Add Farmer
          </button>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            New Purchase
          </button>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Record Sale
          </button>
        </div>
      </div>
    </div>
  );
}
