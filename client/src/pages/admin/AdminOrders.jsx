import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, ChevronDown, X, Eye } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import orderService   from '../../services/orderService';
import useSocket      from '../../hooks/useSocket';
import {
  formatDate, formatPrice,
  getStatusClass, getStatusLabel,
} from '../../utils/formatter';
import toast from 'react-hot-toast';

// Order status options for filter + update
const STATUS_OPTIONS = [
  { value: '',                label: 'All Statuses'      },
  { value: 'received',        label: 'Received'          },
  { value: 'preparing',       label: 'Preparing'         },
  { value: 'in_kitchen',      label: 'In Kitchen'        },
  { value: 'ready',           label: 'Ready'             },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered',       label: 'Delivered'         },
  { value: 'cancelled',       label: 'Cancelled'         },
];

const NEXT_STATUS = {
  received:         'preparing',
  preparing:        'in_kitchen',
  in_kitchen:       'ready',
  ready:            'out_for_delivery',
  out_for_delivery: 'delivered',
};

// ── Order Detail Modal ──
const OrderDetailModal = ({ order, onClose, onStatusUpdate }) => {
  const [newStatus, setNewStatus]   = useState(order.status);
  const [note,      setNote]        = useState('');
  const [updating,  setUpdating]    = useState(false);

  if (!order) return null;

  const handleUpdate = async () => {
    if (newStatus === order.status) {
      toast.error('Please select a different status');
      return;
    }
    setUpdating(true);
    try {
      await orderService.updateOrderStatus(order._id, newStatus, note);
      toast.success(`Order status updated to ${getStatusLabel(newStatus)}`);
      onStatusUpdate(order._id, newStatus);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const canUpdate = !['delivered', 'cancelled'].includes(order.status);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-display font-bold text-gray-900 text-xl">
              Order #{order.orderNumber}
            </h2>
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer */}
          <div className="card p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">👤 Customer</h3>
            <p className="font-bold text-gray-900">{order.user?.name}</p>
            <p className="text-sm text-gray-500">{order.user?.email}</p>
            <p className="text-sm text-gray-500">{order.user?.phone}</p>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-gray-700 text-sm mb-3">🍕 Items</h3>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {item.size} size × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-700">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatPrice(order.pricing?.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span>{order.pricing?.deliveryFee === 0 ? 'FREE' : formatPrice(order.pricing?.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax</span>
                <span>{formatPrice(order.pricing?.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-1">
                <span>Total</span>
                <span className="text-orange-500 text-lg">
                  {formatPrice(order.pricing?.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="card p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">📍 Delivery Address</h3>
            <p className="text-sm text-gray-800 font-medium">{order.deliveryAddress?.name}</p>
            <p className="text-sm text-gray-600">{order.deliveryAddress?.phone}</p>
            <p className="text-sm text-gray-600">{order.deliveryAddress?.street}</p>
            <p className="text-sm text-gray-600">
              {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
            </p>
          </div>

          {/* Payment */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Payment</p>
              <p className="text-xs text-gray-500 capitalize">
                {order.payment?.method === 'razorpay' ? 'Online (Razorpay)' : 'Cash on Delivery'}
              </p>
            </div>
            <span className={`badge ${
              order.payment?.status === 'paid'
                ? 'badge-success'
                : order.payment?.status === 'failed'
                ? 'badge-danger'
                : 'badge-warning'
            }`}>
              {order.payment?.status?.toUpperCase()}
            </span>
          </div>

          {/* Special instructions */}
          {order.specialInstructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-1">📝 Special Instructions</p>
              <p className="text-sm text-yellow-700">{order.specialInstructions}</p>
            </div>
          )}

          {/* Update Status */}
          {canUpdate && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-700 text-sm mb-3">
                🔄 Update Order Status
              </h3>
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-field"
                >
                  {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)"
                  className="input-field"
                />
                <button
                  onClick={handleUpdate}
                  disabled={updating || newStatus === order.status}
                  className="btn-primary w-full"
                >
                  {updating ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    '✅ Update Status'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 text-sm mb-3">📋 Status History</h3>
              <div className="space-y-2">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-orange-500' : 'bg-gray-300'}`} />
                    <div>
                      <span className="font-medium text-gray-800">{getStatusLabel(h.status)}</span>
                      {h.note && <span className="text-gray-500"> — {h.note}</span>}
                      <p className="text-xs text-gray-400">{formatDate(h.updatedAt)}</p>
                    </div>
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

// ── Main AdminOrders ──
const AdminOrders = () => {
  const { socket } = useSocket();

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters,      setFilters]      = useState({ status: '', search: '' });
  const [pagination,   setPagination]   = useState({ page: 1, pages: 1, total: 0 });

  const fetchOrders = useCallback(async (page = 1, showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await orderService.getAllOrders({
        page,
        limit:  10,
        status: filters.status || undefined,
      });
      setOrders(res.data || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.status]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  // ── Socket: real-time new orders ──
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      fetchOrders(1);
      toast.success(`🍕 New order #${data.orderNumber}`);
    };

    const handleOrderUpdated = () => {
      fetchOrders(pagination.page);
    };

    socket.on('admin:new_order',    handleNewOrder);
    socket.on('admin:order_updated', handleOrderUpdated);

    return () => {
      socket.off('admin:new_order',    handleNewOrder);
      socket.off('admin:order_updated', handleOrderUpdated);
    };
  }, [socket, pagination.page, fetchOrders]);

  // Update order in list when status changes
  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o)
    );
  };

  // Quick status advance
  const handleQuickAdvance = async (e, order) => {
    e.stopPropagation();
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    try {
      await orderService.updateOrderStatus(order._id, next);
      handleStatusUpdate(order._id, next);
      toast.success(`Order → ${getStatusLabel(next)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  // Filter
  const filteredOrders = orders.filter((o) => {
    if (!filters.search) return true;
    const s = filters.search.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(s) ||
      o.user?.name?.toLowerCase().includes(s) ||
      o.user?.email?.toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Management</h1>
          <p className="subtitle mt-1">
            {pagination.total} total orders
          </p>
        </div>
        <button
          onClick={() => fetchOrders(1, true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 btn-sm"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, customer..."
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className="input-field pl-9"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="input-field pl-9 pr-8 appearance-none cursor-pointer min-w-40"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Orders Table ── */}
      <div className="card overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="empty-state py-16">
            <p className="text-5xl mb-4">📦</p>
            <p className="empty-state-title">No orders found</p>
            <p className="empty-state-text">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td>
                        <span className="font-mono text-xs font-bold text-gray-700">
                          #{order.orderNumber}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-sm text-gray-800">
                            {order.user?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-32">
                            {order.user?.email}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">
                          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-orange-500 text-sm">
                          {formatPrice(order.pricing?.total)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          order.payment?.status === 'paid'
                            ? 'badge-success'
                            : order.payment?.status === 'failed'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}>
                          {order.payment?.status}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusClass(order.status)}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-400">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* Quick advance button */}
                          {NEXT_STATUS[order.status] && (
                            <button
                              onClick={(e) => handleQuickAdvance(e, order)}
                              className="text-xs bg-orange-100 text-orange-600 hover:bg-orange-200 px-2 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap"
                              title={`Advance to ${getStatusLabel(NEXT_STATUS[order.status])}`}
                            >
                              → {getStatusLabel(NEXT_STATUS[order.status]).split(' ')[0]}
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} orders)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchOrders(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="btn-secondary btn-sm disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => fetchOrders(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="btn-secondary btn-sm disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default AdminOrders;