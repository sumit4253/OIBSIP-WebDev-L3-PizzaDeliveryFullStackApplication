import { formatPrice } from '../../utils/formatter';
import { FREE_DELIVERY_MIN } from '../../utils/constants';
import { Truck, Tag } from 'lucide-react';
import useCart from '../../hooks/useCart';

const CartSummary = ({ showCheckout = false, onCheckout }) => {
  const { subtotal, deliveryFee, tax, total, cartItems } = useCart();

  const toFreeDelivery = FREE_DELIVERY_MIN - subtotal;

  return (
    <div className="card p-5">
      <h3 className="font-display font-bold text-gray-900 mb-4">Order Summary</h3>

      {/* Free delivery progress */}
      {subtotal > 0 && subtotal < FREE_DELIVERY_MIN && (
        <div className="mb-4 p-3 bg-orange-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={14} className="text-orange-500" />
            <p className="text-xs text-orange-700 font-medium">
              Add {formatPrice(toFreeDelivery)} more for FREE delivery!
            </p>
          </div>
          <div className="w-full bg-orange-100 rounded-full h-1.5">
            <div
              className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((subtotal / FREE_DELIVERY_MIN) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Price breakdown */}
      <div className="space-y-2.5 mb-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal ({cartItems.length} items)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Truck size={13} />
            Delivery Fee
          </span>
          <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
            {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>GST (18%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 mb-4">
        <div className="flex justify-between">
          <span className="font-display font-bold text-gray-900">Total</span>
          <span className="font-display font-bold text-orange-500 text-xl">
            {formatPrice(total)}
          </span>
        </div>
        <p className="text-xs text-gray-400 text-right mt-0.5">Inclusive of all taxes</p>
      </div>

      {showCheckout && (
        <button
          onClick={onCheckout}
          disabled={cartItems.length === 0}
          className="btn-primary w-full btn-lg"
        >
          🛵 Proceed to Checkout
        </button>
      )}
    </div>
  );
};

export default CartSummary;