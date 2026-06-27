import { Link } from 'react-router-dom';
import { formatDate, formatPrice, getStatusClass, getStatusLabel } from '../../utils/formatter';
import { Package, ChevronRight } from 'lucide-react';

const OrderCard = ({ order }) => {
  return (
    <div className="card p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold text-gray-900 text-sm">
              #{order.orderNumber}
            </span>
            <span className={getStatusClass(order.status)}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
        </div>
        <p className="font-display font-bold text-orange-500 text-lg flex-shrink-0">
          {formatPrice(order.pricing?.total)}
        </p>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3">
        {order.items?.slice(0, 2).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Package size={13} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">
              {item.name} × {item.quantity}
            </span>
            <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
              ({item.size})
            </span>
          </div>
        ))}
        {order.items?.length > 2 && (
          <p className="text-xs text-gray-400 ml-5">
            +{order.items.length - 2} more items
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          {order.payment?.method === 'razorpay' ? '💳 Online' : '💵 COD'} •{' '}
          <span className={order.payment?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
            {order.payment?.status}
          </span>
        </div>
        <Link
          to={`/orders/${order._id}`}
          className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
        >
          Track Order
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default OrderCard;