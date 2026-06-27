import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Package, MapPin, Clock, Phone, ArrowLeft, RefreshCw } from 'lucide-react';
import orderService  from '../../services/orderService';
import OrderStatus   from '../../components/order/OrderStatus';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useSocket     from '../../hooks/useSocket';
import { formatDate, formatPrice, getStatusLabel } from '../../utils/formatter';
import toast from 'react-hot-toast';

const OrderTracking = () => {
  const { id }       = useParams();
  const location     = useLocation();
  const { socket }   = useSocket();

  const [order,       setOrder]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const isSuccess = location.state?.success;

  const fetchOrder = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await orderService.getOrderById(id);
      setOrder(res.data.order);
    } catch (err) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // ── Real-time Socket listener ──
  useEffect(() => {
    if (!socket || !id) return;

    // Join this order's room
    socket.emit('join:order', id);

    // Listen for status updates
    const handleStatusUpdate = (data) => {
      if (data.orderId === id || data.orderId?.toString() === id) {
        setOrder((prev) => prev ? {
          ...prev,
          status:        data.status,
          statusHistory: data.statusHistory,
        } : prev);

        toast.success(`Order ${getStatusLabel(data.status)}! ${
          data.status === 'out_for_delivery' ? '🛵' :
          data.status === 'delivered'        ? '🎉' : '🍕'
        }`);
      }
    };

    socket.on('order:status_updated', handleStatusUpdate);

    return () => {
      socket.off('order:status_updated', handleStatusUpdate);
      socket.emit('leave:order', id);
    };
  }, [socket, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading order..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom py-10 text-center">
        <p className="text-6xl mb-4">📦</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order not found</h2>
        <Link to="/orders" className="btn-primary">View All Orders</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Success Banner */}
      {isSuccess && (
        <div className="bg-green-500 text-white py-4 text-center animate-fade-in">
          <p className="font-display font-bold text-lg">
            🎉 Order Placed Successfully!
          </p>
          <p className="text-green-100 text-sm">
            Your order #{order.orderNumber} is confirmed
          </p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="font-display font-bold text-gray-900 text-xl">
                  Order #{order.orderNumber}
                </h1>
                <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 max-w-3xl">
        {/* ── Real-time Status ── */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-gray-900 text-lg">
              📍 Live Tracking
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          </div>

          <OrderStatus currentStatus={order.status} />

          {/* ETA */}
          {!['delivered', 'cancelled'].includes(order.status) && order.estimatedDeliveryTime && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock size={14} className="text-orange-500" />
              <span>
                Estimated delivery by{' '}
                <strong>
                  {new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit', hour12: true,
                  })}
                </strong>
              </span>
            </div>
          )}

          {order.status === 'delivered' && order.deliveredAt && (
            <div className="mt-6 p-3 bg-green-50 rounded-xl text-center">
              <p className="text-green-700 font-semibold text-sm">
                ✅ Delivered on {formatDate(order.deliveredAt)}
              </p>
            </div>
          )}
        </div>

        {/* ── Status History ── */}
        {order.statusHistory?.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="font-display font-bold text-gray-900 text-lg mb-4">
              📋 Status History
            </h2>
            <div className="space-y-3">
              {[...order.statusHistory].reverse().map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-orange-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {getStatusLabel(entry.status)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(entry.updatedAt)}</p>
                    {entry.note && (
                      <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── Order Items ── */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Package size={18} className="text-orange-500" />
              Order Items
            </h2>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    🍕
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {item.size} size × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
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
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-orange-500 text-lg">{formatPrice(order.pricing?.total)}</span>
              </div>
            </div>
          </div>

          {/* ── Delivery Info ── */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-orange-500" />
                Delivery Address
              </h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">{order.deliveryAddress?.name}</p>
                <p className="flex items-center gap-1">
                  <Phone size={12} className="text-gray-400" />
                  {order.deliveryAddress?.phone}
                </p>
                <p>{order.deliveryAddress?.street}</p>
                {order.deliveryAddress?.landmark && (
                  <p className="text-gray-400">Near: {order.deliveryAddress.landmark}</p>
                )}
                <p>
                  {order.deliveryAddress?.city}, {order.deliveryAddress?.state}
                </p>
                <p className="font-medium">{order.deliveryAddress?.pincode}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="card p-5">
              <h2 className="font-display font-bold text-gray-900 mb-3">
                💳 Payment
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium capitalize">
                    {order.payment?.method === 'razorpay' ? 'Online (Razorpay)' : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-semibold ${
                    order.payment?.status === 'paid'
                      ? 'text-green-600'
                      : order.payment?.status === 'failed'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {order.payment?.status?.toUpperCase()}
                  </span>
                </div>
                {order.payment?.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment ID</span>
                    <span className="font-mono text-xs">{order.payment.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel button (only for early stages) */}
            {['received', 'preparing'].includes(order.status) && (
              <button
                onClick={async () => {
                  const reason = window.prompt('Reason for cancellation:');
                  if (!reason) return;
                  try {
                    await orderService.cancelOrder(id, reason);
                    fetchOrder();
                    toast.success('Order cancelled');
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Cannot cancel order');
                  }
                }}
                className="btn-danger w-full"
              >
                ❌ Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;