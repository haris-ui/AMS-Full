import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Menu,
  X,
  FileText,
  Receipt
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  onNavigate: (path: string) => void;
}

interface NavItem {
  name: string;
  icon: typeof LayoutDashboard;
  path: string;
  roles?: string[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { name: 'Farmers', icon: Users, path: 'farmers' },
  { name: 'Products', icon: Package, path: 'products' },
  { name: 'Purchases', icon: ShoppingCart, path: 'purchases' },
  { name: 'Sales', icon: TrendingUp, path: 'sales' },
  { name: 'Transactions', icon: Receipt, path: 'transactions' },
  { name: 'Reports', icon: FileText, path: 'reports' },
];

export function Layout({ children, onNavigate }: LayoutProps) {
  const { profile, role, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigation = (path: string) => {
    setCurrentPage(path);
    setSidebarOpen(false);
    onNavigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Artiya</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200 hidden lg:block">
              <h1 className="text-2xl font-bold text-gray-900">Artiya</h1>
              <p className="text-sm text-gray-500 mt-1">Management System</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.path;

                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                      transition-colors duration-150
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="mb-3 px-4">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {role?.role_name || 'No Role'}
                </p>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
