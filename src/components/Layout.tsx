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

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => setSidebarOpen(false);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, path: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigation(path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm safe-top">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Artiya</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="btn-ghost p-2 rounded-lg touch-target-large"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div className="flex min-h-screen">
        {/* Desktop/Mobile Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-white border-r border-gray-200
            transform transition-all duration-300 ease-in-out shadow-strong lg:shadow-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          aria-hidden={!sidebarOpen && 'true'}
        >
          <div className="h-full flex flex-col scrollbar-thin">
            {/* Desktop Header */}
            <div className="p-6 border-b border-gray-200 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Artiya</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Management System</p>
                </div>
              </div>
            </div>
            
            {/* Mobile Header in Sidebar */}
            <div className="p-6 border-b border-gray-200 lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Artiya</h1>
                    <p className="text-xs text-gray-500">Management System</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="btn-ghost p-2 rounded-lg"
                  aria-label="Close sidebar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto" role="navigation" aria-label="Main navigation">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentPage === item.path;

                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    onKeyDown={(e) => handleKeyDown(e, item.path)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left
                      transition-all duration-200 touch-target-large group relative
                      ${isActive
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 font-semibold shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                      }
                    `}
                    style={{ '--stagger': index } as React.CSSProperties}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className={`
                      p-2 rounded-lg transition-colors duration-200
                      ${isActive 
                        ? 'bg-primary-100 text-primary-600' 
                        : 'text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700'
                      }
                    `}>
                      <Icon size={18} />
                    </div>
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-l-full"></div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Profile Section */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50">
              <div className="mb-4 px-4 py-3 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize truncate">
                      {role?.role_name || 'No Role'}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                aria-label="Sign out of your account"
              >
                <div className="p-1 rounded-md group-hover:bg-red-100 transition-colors duration-200">
                  <LogOut size={18} />
                </div>
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-0 overflow-x-hidden">
          <div className="animate-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
