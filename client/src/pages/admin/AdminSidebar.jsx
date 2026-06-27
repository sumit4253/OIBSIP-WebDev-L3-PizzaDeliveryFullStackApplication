import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package,
  Users, BarChart2, LogOut, Menu, X,
} from 'lucide-react';
import adminService from '../../services/adminService';
import toast        from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/admin/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/admin/orders',     label: 'Orders',     icon: ShoppingBag     },
  { to: '/admin/inventory',  label: 'Inventory',  icon: Package         },
  { to: '/admin/users',      label: 'Users',      icon: Users           },
  { to: '/admin/analytics',  label: 'Analytics',  icon: BarChart2       },
];

const AdminSidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate  = useNavigate();

  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem('admin') || '{}');
    } catch {
      return {};
    }
  })();

  const handleLogout = async () => {
    try {
      await adminService.logout();
      toast.success('Logged out successfully');
      navigate('/admin/login', { replace: true });
    } catch (err) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      navigate('/admin/login', { replace: true });
    }
  };

  const isActive = (path) => location.pathname === path;

  const SidebarLinks = () => (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const Icon   = item.icon;
        const active = isActive(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              active
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            <Icon size={18} className={active ? 'text-white' : 'text-gray-400'} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">🍕</span>
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-gray-900 text-sm">Pizza Admin</p>
          <p className="text-xs text-orange-500 capitalize">{admin?.role || 'admin'}</p>
        </div>
        <button
          className="lg:hidden ml-auto p-1 hover:bg-gray-100 rounded-lg"
          onClick={() => setMobileOpen(false)}
        >
          <X size={16} />
        </button>
      </div>

      {/* Admin info */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {admin?.name || 'Admin'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {admin?.email || ''}
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <SidebarLinks />

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile: Hamburger button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md border border-gray-200"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* Mobile: Overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-56 bg-white z-50 shadow-2xl flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
};

export default AdminSidebar;