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
    <div className="container-responsive py-6 lg:py-8 space-y-6 lg:space-y-8 safe-bottom">
      {/* Header Section */}
      <header className="animate-in">
        <h1 className="text-responsive-xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 text-responsive-sm">
          Welcome back, <span className="font-medium text-gray-900">{profile?.full_name || 'User'}</span>
        </p>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 stagger-animation">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="card p-6 group cursor-pointer transform hover:scale-[1.02] transition-all duration-200"
              style={{ '--stagger': index } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-200`}>
                  <Icon className={`${card.textColor} transition-transform duration-200 group-hover:scale-110`} size={24} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Financial and Activity Sections */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Financial Overview */}
        <article className="card p-6 lg:p-8">
          <header className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-3 rounded-xl">
              <DollarSign className="text-primary-600" size={22} />
            </div>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Financial Overview</h2>
          </header>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <span className="text-gray-700 font-medium mb-1 sm:mb-0">Total Purchases</span>
              <span className="text-xl lg:text-2xl font-bold text-gray-900">
                ₹{stats.totalPurchaseAmount.toLocaleString()}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <span className="text-gray-700 font-medium mb-1 sm:mb-0">Total Sales</span>
              <span className="text-xl lg:text-2xl font-bold text-gray-900">
                ₹{stats.totalSalesAmount.toLocaleString()}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-xl border border-success-200 shadow-sm">
              <span className="text-success-700 font-semibold mb-1 sm:mb-0 flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                Net Margin
              </span>
              <span className="text-xl lg:text-2xl font-bold text-success-700">
                ₹{(stats.totalSalesAmount - stats.totalPurchaseAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </article>

        {/* Recent Activity */}
        <article className="card p-6 lg:p-8">
          <header className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl">
              <Activity className="text-purple-600" size={22} />
            </div>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Recent Activity</h2>
          </header>
          
          <div className="space-y-3 scrollbar-thin max-h-80 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-500 text-sm">No recent activity</p>
                <p className="text-gray-400 text-xs mt-1">Activity will appear here as you use the system</p>
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 animate-in"
                  style={{ '--stagger': index } as React.CSSProperties}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">{activity.action}</p>
                      {activity.description && (
                        <p className="text-xs text-gray-600 mb-2 leading-relaxed">{activity.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {/* Quick Actions Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl shadow-strong p-6 sm:p-8 lg:p-10 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 30px 30px, rgba(255,255,255,0.1) 2px, transparent 2px)', backgroundSize: '60px 60px' }}></div>
        </div>
        
        <div className="relative z-10">
          <header className="mb-6 lg:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-balance">
              Quick Actions
            </h2>
            <p className="text-primary-100 text-sm sm:text-base leading-relaxed max-w-2xl">
              Get started by managing your farmers, products, and transactions with these quick shortcuts
            </p>
          </header>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <button className="btn bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:shadow-lg active:scale-95 transition-all duration-200 group">
              <span className="flex items-center gap-2">
                <Users size={18} className="group-hover:scale-110 transition-transform duration-200" />
                Add Farmer
              </span>
            </button>
            
            <button className="btn bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:shadow-lg active:scale-95 transition-all duration-200 group">
              <span className="flex items-center gap-2">
                <ShoppingCart size={18} className="group-hover:scale-110 transition-transform duration-200" />
                New Purchase
              </span>
            </button>
            
            <button className="btn bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:shadow-lg active:scale-95 transition-all duration-200 group">
              <span className="flex items-center gap-2">
                <TrendingUp size={18} className="group-hover:scale-110 transition-transform duration-200" />
                Record Sale
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
