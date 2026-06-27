import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package,
  Users, BarChart2, LogOut, Menu, X, Pizza,
} from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin/dashboard',  label: 'Dashboard',  icon: <LayoutDashboard size={18} /> },
  { to: '/admin/orders',     label: 'Orders',     icon: <ShoppingBag size={18} />     },
  { to: '/admin/inventory',  label: 'Inventory',  icon: <Package size={18} />         },
  { to: '/admin/users',      label: 'Users',      icon: <Users size={18} />            },
  { to: '/admin/analytics',  label: 'Analytics',  icon: <BarChart2 size={18} />       },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const admin = JSON.parse(localStorage.getItem('admin') || '{}');

  const handleLogout = async () => {
    await adminService.logout();
    toast.success('Admin logged out');
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center gap-3 p-4 border-b border-gray-100 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🍕</span>
            <span className="font-display font-bold text-gray-900">
              Pizza <span className="text-orange-500">Admin</span>
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Admin info */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-pizza flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{admin?.name}</p>
              <p className="text-xs text-orange-500 capitalize">{admin?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive(item.to)
                ? 'bg-orange-50 text-orange-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className={isActive(item.to) ? 'text-orange-500' : 'text-gray-400'}>
              {item.icon}
            </span>
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 bg-white rounded-xl shadow-md border border-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white z-50 shadow-xl">
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={20} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
};

export default AdminSidebar;