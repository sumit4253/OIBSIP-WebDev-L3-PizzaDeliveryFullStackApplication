import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, RefreshCw } from 'lucide-react';
import orderService   from '../../services/orderService';
import OrderCard      from '../../components/order/OrderCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const OrderHistory = () => {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const res = await orderService.getMyOrders({ limit: 20 });
      setOrders(res.data || []);
    } catch (err) {
      console.error('Orders fetch error:', err);
      setError('Failed to load orders. Please try again.');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your orders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package size={20} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                  My Orders
                </h1>
                <p className="text-sm text-gray-500">
                  {orders.length} order{orders.length !== 1 ? 's' : ''} total
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="btn-secondary btn-sm flex items-center gap-2"
            >
              <RefreshCw
                size={14}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-6">📦</div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
                No orders yet
              </h2>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Looks like you haven't ordered anything yet.
                Time to get some pizza!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/menu"  className="btn-primary btn-lg">
                  🍕 Browse Menu
                </Link>
                <Link to="/build" className="btn-outline btn-lg">
                  🔨 Build Pizza
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;