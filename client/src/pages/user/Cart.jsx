import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import CartItem    from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import useCart     from '../../hooks/useCart';
import useAuth     from '../../hooks/useAuth';
import toast       from 'react-hot-toast';

const Cart = () => {
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated }      = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Looks like you haven't added any pizzas yet. Let's fix that!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/menu"  className="btn-primary btn-lg">🍕 Browse Menu</Link>
            <Link to="/build" className="btn-outline btn-lg">🔨 Build Pizza</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={24} className="text-orange-500" />
                  Your Cart
                </h1>
                <p className="text-sm text-gray-500">
                  {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                clearCart();
                toast.success('Cart cleared');
              }}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <CartItem key={item.cartId} item={item} />
            ))}

            {/* Continue shopping */}
            <div className="flex gap-3 pt-2">
              <Link to="/menu"  className="btn-secondary flex-1 text-center">
                + Add More Pizzas
              </Link>
              <Link to="/build" className="btn-outline flex-1 text-center">
                🔨 Build Another
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <CartSummary showCheckout onCheckout={handleCheckout} />

            {/* Trust badges */}
            <div className="mt-4 card p-4">
              <div className="space-y-3">
                {[
                  { icon: '🔒', text: 'Secure payment via Razorpay' },
                  { icon: '⚡', text: 'Instant order confirmation'  },
                  { icon: '🛵', text: 'Live order tracking'         },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-lg">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;