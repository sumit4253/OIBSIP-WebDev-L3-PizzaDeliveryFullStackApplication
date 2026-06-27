import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Users, RefreshCw,
  ChevronRight, AlertTriangle,
} from 'lucide-react';
import StatsCard        from '../../components/admin/StatsCard';
import LoadingSpinner   from '../../components/common/LoadingSpinner';
import adminService     from '../../services/adminService';
import orderService     from '../../services/orderService';
import inventoryService from '../../services/inventoryService';
import useSocket        from '../../hooks/useSocket';
import {
  formatPrice, formatDate,
  getStatusClass, getStatusLabel,
} from '../../utils/formatter';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { socket } = useSocket();

  const [analytics,    setAnalytics]    = useState(null);
  const [userStats,    setUserStats]    = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock,     setLowStock]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [refreshing,   setRefreshing]   = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const results = await Promise.allSettled([
        adminService.getAnalytics('7'),
        adminService.getUserStats(),
        orderService.getAllOrders({ limit: 8, page: 1 }),
        inventoryService.getLowStock(),
      ]);

      // Handle each result individually so one failure doesn't break all
      if (results[0].status === 'fulfilled') {
        setAnalytics(results[0].value.data);
      }
      if (results[1].status === 'fulfilled') {
        setUserStats(results[1].value.data);
      }
      if (results[2].status === 'fulfilled') {
        setRecentOrders(results[2].value.data || []);
      }
      if (results[3].status === 'fulfilled') {
        setLowStock(results[3].value.data?.items || []);
      }

      // Log any failures for debugging
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`Dashboard fetch ${i} failed:`, r.reason?.message);
        }
      });

    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      setRecentOrders((prev) => [data, ...prev].slice(0, 8));
      toast.success(`🍕 New order! #${data.orderNumber}`);
    };

    const handleLowStock = (item) => {
      setLowStock((prev) => {
        const exists = prev.find((i) => i._id === item._id);
        return exists ? prev : [item, ...prev];
      });
    };

    socket.on('admin:new_order',  handleNewOrder);
    socket.on('admin:low_stock',  handleLowStock);

    return () => {
      socket.off('admin:new_order',  handleNewOrder);
      socket.off('admin:low_stock',  handleLowStock);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
          <button
            onClick={() => fetchData()}
            className="btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back! Here's what's happening.
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 btn-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={summary.totalOrders ?? '—'}
          subtitle={`${summary.pendingOrders ?? 0} pending`}
          icon="📦"
          color="orange"
        />
        <StatsCard
          title="Revenue (7 days)"
          value={summary.recentRevenue != null ? formatPrice(summary.recentRevenue) : '—'}
          subtitle={`All time: ${summary.totalRevenue != null ? formatPrice(summary.totalRevenue) : '—'}`}
          icon="💰"
          color="green"
        />
        <StatsCard
          title="Total Users"
          value={userStats?.total ?? '—'}
          subtitle={`${userStats?.newThisMonth ?? 0} new this month`}
          icon="👥"
          color="blue"
        />
        <StatsCard
          title="Delivered"
          value={summary.deliveredOrders ?? '—'}
          subtitle={`${summary.cancelledOrders ?? 0} cancelled`}
          icon="✅"
          color="purple"
        />
      </div>

      {/* ── Low Stock Alert ── */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-display font-bold text-red-800">
              Low Stock Alert — {lowStock.length} item{lowStock.length > 1 ? 's' : ''}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.slice(0, 6).map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-red-100"
              >
                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                  {item.category === 'base'       ? '🫓'
                  : item.category === 'sauce'     ? '🍅'
                  : item.category === 'cheese'    ? '🧀'
                  : item.category === 'vegetable' ? '🥦'
                  : '📦'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-red-600">
                    {item.quantity} / {item.threshold} {item.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-display font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={18} className="text-orange-500" />
              Recent Orders
            </h2>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-semibold"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-medium text-gray-500">No orders yet</p>
              <p className="text-sm mt-1">Orders will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Order
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => (
                    <tr
                      key={order._id || i}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs font-bold text-gray-700">
                          #{order.orderNumber || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800 text-sm">
                          {order.user?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-32">
                          {order.user?.email || ''}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-orange-500">
                          {formatPrice(order.pricing?.total || 0)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={getStatusClass(order.status)}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions + Order Breakdown */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-display font-bold text-gray-900 mb-3">
              ⚡ Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { to: '/admin/orders',    icon: '📦', label: 'Manage Orders'    },
                { to: '/admin/inventory', icon: '🏭', label: 'Update Inventory' },
                { to: '/admin/users',     icon: '👥', label: 'Manage Users'     },
                { to: '/admin/analytics', icon: '📊', label: 'View Analytics'   },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{link.icon}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
                      {link.label}
                    </span>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-gray-400 group-hover:text-orange-500"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* User Stats */}
          {userStats && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                User Overview
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Users',    value: userStats.total,        color: 'text-blue-600'   },
                  { label: 'Active',         value: userStats.active,       color: 'text-green-600'  },
                  { label: 'Verified',       value: userStats.verified,     color: 'text-purple-600' },
                  { label: 'New This Month', value: userStats.newThisMonth, color: 'text-orange-600' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className={`font-bold ${row.color}`}>{row.value ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Breakdown */}
          {analytics?.statusBreakdown?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-display font-bold text-gray-900 mb-3">
                📊 Order Breakdown
              </h3>
              <div className="space-y-2">
                {analytics.statusBreakdown.map((item) => (
                  <div key={item._id} className="flex items-center justify-between">
                    <span className={getStatusClass(item._id)}>
                      {getStatusLabel(item._id)}
                    </span>
                    <span className="font-bold text-gray-800 text-sm">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;