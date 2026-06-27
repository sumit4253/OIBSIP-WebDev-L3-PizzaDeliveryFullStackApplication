import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatPrice, getImageUrl } from '../../utils/formatter';
import useCart from '../../hooks/useCart';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Image */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-orange-50">
        <img
          src={item.image ? getImageUrl(item.image) : 'https://via.placeholder.com/80?text=🍕'}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=🍕'; }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
        <p className="text-xs text-gray-400 capitalize mt-0.5">{item.size} size</p>
        <p className="text-sm font-bold text-orange-500 mt-1">{formatPrice(item.price)}</p>
      </div>

      {/* Quantity + Remove */}
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => removeFromCart(item.cartId)}
          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="w-6 text-center text-sm font-bold text-gray-900">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>

        <p className="text-xs font-semibold text-gray-700">
          {formatPrice(item.subtotal)}
        </p>
      </div>
    </div>
  );
};

export default CartItem;