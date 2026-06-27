import { useState, useEffect } from 'react';
import { useNavigate, Link }   from 'react-router-dom';
import {
  MapPin, CreditCard, Check,
  ChevronLeft, ShoppingBag, AlertCircle,
} from 'lucide-react';
import useCart             from '../../hooks/useCart';
import useAuth             from '../../hooks/useAuth';
import orderService        from '../../services/orderService';
import paymentService      from '../../services/paymentService';
import CartSummary         from '../../components/cart/CartSummary';
import LoadingSpinner      from '../../components/common/LoadingSpinner';
import { PAYMENT_METHODS } from '../../utils/constants';
import { validators }      from '../../utils/validators';
import { formatPrice }     from '../../utils/formatter';
import toast               from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi',
  'Jammu and Kashmir','Ladakh','Puducherry',
];

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, total, clearCart } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [step,          setStep]          = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [placing,       setPlacing]       = useState(false);
  const [errors,        setErrors]        = useState({});
  const [instructions,  setInstructions]  = useState('');

  const [address, setAddress] = useState({
    name:     '',
    phone:    '',
    street:   '',
    city:     '',
    state:    '',
    pincode:  '',
    landmark: '',
  });

  // ── Populate address from user profile once loaded ──
  useEffect(() => {
    if (user) {
      setAddress({
        name:     user.name     || '',
        phone:    user.phone    || '',
        street:   user.address?.street   || '',
        city:     user.address?.city     || '',
        state:    user.address?.state    || '',
        pincode:  user.address?.pincode  || '',
        landmark: user.address?.landmark || '',
      });
    }
  }, [user]);

  // ── Guard: wait for auth to resolve ──
  // Do NOT redirect until authLoading is false
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
    }
  }, [authLoading, isAuthenticated, cartItems.length, navigate]);

  // ── Show spinner while auth is resolving ──
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading checkout..." />
      </div>
    );
  }

  // ── Show spinner while placing order ──
  if (placing) {
    return (
      <LoadingSpinner
        fullScreen
        text={
          paymentMethod === 'razorpay'
            ? 'Opening payment gateway...'
            : 'Placing your order...'
        }
      />
    );
  }

  // ── Don't render if no items (redirect will fire) ──
  if (!isAuthenticated || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Redirecting..." />
      </div>
    );
  }

  // ── Validate address ──
  const validateAddress = () => {
    const e = {};
    if (!address.name.trim())   e.name    = 'Full name is required';
    if (!address.phone)         e.phone   = 'Phone number is required';
    else {
      const pErr = validators.phone(address.phone);
      if (pErr) e.phone = pErr;
    }
    if (!address.street.trim()) e.street  = 'Street address is required';
    if (!address.city.trim())   e.city    = 'City is required';
    if (!address.state)         e.state   = 'Please select a state';
    if (!address.pincode)       e.pincode = 'Pincode is required';
    else {
      const pcErr = validators.pincode(address.pincode);
      if (pcErr) e.pincode = pcErr;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Build order payload ──
  const buildOrderPayload = (razorpayOrderId = null) => ({
    items: cartItems.map((item) => ({
      itemType:    item.itemType,
      pizza:       item.pizza?._id || item.pizza || undefined,
      customPizza: item.customPizza || undefined,
      name:        item.name,
      size:        item.size,
      price:       item.price,
      quantity:    item.quantity,
      subtotal:    item.subtotal,
    })),
    deliveryAddress:     address,
    specialInstructions: instructions,
    payment: {
      method:          paymentMethod,
      razorpayOrderId: razorpayOrderId || undefined,
    },
  });

  // ── COD Order ──
  const handleCODOrder = async () => {
    setPlacing(true);
    try {
      const res = await orderService.placeOrder(buildOrderPayload());
      clearCart();
      toast.success('Order placed successfully! 🍕');
      navigate(`/orders/${res.data.order._id}`, {
        state: {
          success:     true,
          orderNumber: res.data.order.orderNumber,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ── Razorpay Payment ──
  const handleRazorpayPayment = async () => {
    setPlacing(true);
    try {
      // 1. Load script
      const loaded = await paymentService.loadRazorpayScript();
      if (!loaded) {
        toast.error('Payment gateway failed to load. Please try again.');
        setPlacing(false);
        return;
      }

      // 2. Create Razorpay order
      const rzpRes = await paymentService.createOrder(total);
      const { orderId: rzpOrderId, amount, currency, key } = rzpRes.data;

      // 3. Save our order first
      const orderRes = await orderService.placeOrder(buildOrderPayload(rzpOrderId));
      const appOrder = orderRes.data.order;

      // 4. Open Razorpay modal
      const paymentResponse = await paymentService.openCheckout({
        key,
        amount,
        currency,
        name:        'Pizza App',
        description: `Order #${appOrder.orderNumber}`,
        order_id:    rzpOrderId,
        prefill: {
          name:    user?.name  || address.name,
          email:   user?.email || '',
          contact: address.phone,
        },
        theme: { color: '#f97316' },
        notes: { orderId: appOrder._id },
      });

      // 5. Verify payment
      await paymentService.verifyPayment({
        razorpay_order_id:   paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature:  paymentResponse.razorpay_signature,
        orderId:             appOrder._id,
      });

      clearCart();
      toast.success('Payment successful! Order confirmed 🎉');
      navigate(`/orders/${appOrder._id}`, {
        state: {
          success:     true,
          orderNumber: appOrder.orderNumber,
        },
      });

    } catch (err) {
      if (err.message === 'Payment cancelled by user') {
        toast.error('Payment cancelled');
      } else {
        toast.error(
          err.response?.data?.message ||
          err.message ||
          'Payment failed. Please try again.'
        );
      }
    } finally {
      setPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === 'cod') {
      handleCODOrder();
    } else {
      handleRazorpayPayment();
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cart')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="font-display font-bold text-xl text-gray-900">
              Checkout
            </h1>

            {/* Step progress */}
            <div className="ml-auto flex items-center gap-3">
              {[
                { n: 1, label: 'Address' },
                { n: 2, label: 'Payment' },
              ].map(({ n, label }) => (
                <div key={n} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > n
                      ? 'bg-green-500 text-white'
                      : step === n
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > n ? <Check size={14} /> : n}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    step >= n ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                  {n < 2 && (
                    <div className={`w-8 h-0.5 ${step > n ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── STEP 1: Delivery Address ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Step header */}
              <div
                className={`flex items-center gap-3 p-5 cursor-pointer ${step === 2 ? 'hover:bg-gray-50' : ''}`}
                onClick={() => step === 2 && setStep(1)}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  step > 1 ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {step > 1
                    ? <Check size={18} className="text-green-600" />
                    : <MapPin size={18} className="text-orange-500" />
                  }
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-bold text-gray-900 text-lg">
                    Delivery Address
                  </h2>
                  {step === 2 && address.street && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {address.street}, {address.city} — <span className="text-orange-500 font-medium">Edit</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Address form */}
              {step === 1 && (
                <div className="px-5 pb-6 border-t border-gray-100">
                  <div className="pt-5 space-y-4">

                    {/* Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Full Name *</label>
                        <input
                          name="name"
                          value={address.name}
                          onChange={handleAddressChange}
                          placeholder="John Doe"
                          className={`input-field ${errors.name ? 'input-error' : ''}`}
                        />
                        {errors.name && (
                          <p className="input-error-msg flex items-center gap-1 mt-1">
                            <AlertCircle size={12} /> {errors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="input-label">Phone Number *</label>
                        <input
                          name="phone"
                          value={address.phone}
                          onChange={handleAddressChange}
                          placeholder="9876543210"
                          maxLength={10}
                          className={`input-field ${errors.phone ? 'input-error' : ''}`}
                        />
                        {errors.phone && (
                          <p className="input-error-msg flex items-center gap-1 mt-1">
                            <AlertCircle size={12} /> {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Street */}
                    <div>
                      <label className="input-label">Street Address *</label>
                      <input
                        name="street"
                        value={address.street}
                        onChange={handleAddressChange}
                        placeholder="House No, Building, Street, Area"
                        className={`input-field ${errors.street ? 'input-error' : ''}`}
                      />
                      {errors.street && (
                        <p className="input-error-msg flex items-center gap-1 mt-1">
                          <AlertCircle size={12} /> {errors.street}
                        </p>
                      )}
                    </div>

                    {/* Landmark */}
                    <div>
                      <label className="input-label">
                        Landmark{' '}
                        <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <input
                        name="landmark"
                        value={address.landmark}
                        onChange={handleAddressChange}
                        placeholder="Near park, opposite school..."
                        className="input-field"
                      />
                    </div>

                    {/* City + State + Pincode */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="input-label">City *</label>
                        <input
                          name="city"
                          value={address.city}
                          onChange={handleAddressChange}
                          placeholder="Mumbai"
                          className={`input-field ${errors.city ? 'input-error' : ''}`}
                        />
                        {errors.city && (
                          <p className="input-error-msg flex items-center gap-1 mt-1">
                            <AlertCircle size={12} /> {errors.city}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="input-label">State *</label>
                        <select
                          name="state"
                          value={address.state}
                          onChange={handleAddressChange}
                          className={`input-field ${errors.state ? 'input-error' : ''}`}
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {errors.state && (
                          <p className="input-error-msg flex items-center gap-1 mt-1">
                            <AlertCircle size={12} /> {errors.state}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="input-label">Pincode *</label>
                        <input
                          name="pincode"
                          value={address.pincode}
                          onChange={handleAddressChange}
                          placeholder="400001"
                          maxLength={6}
                          className={`input-field ${errors.pincode ? 'input-error' : ''}`}
                        />
                        {errors.pincode && (
                          <p className="input-error-msg flex items-center gap-1 mt-1">
                            <AlertCircle size={12} /> {errors.pincode}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Special instructions */}
                    <div>
                      <label className="input-label">
                        Special Instructions{' '}
                        <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Extra spicy, ring doorbell twice..."
                        rows={2}
                        maxLength={200}
                        className="input-field resize-none"
                      />
                      <p className="text-xs text-gray-400 text-right mt-1">
                        {instructions.length}/200
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (validateAddress()) setStep(2);
                      }}
                      className="btn-primary w-full btn-lg"
                    >
                      Continue to Payment →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── STEP 2: Payment ── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
                <div className="flex items-center gap-3 p-5">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                    <CreditCard size={18} className="text-orange-500" />
                  </div>
                  <h2 className="font-display font-bold text-gray-900 text-lg">
                    Payment Method
                  </h2>
                </div>

                <div className="px-5 pb-6 border-t border-gray-100 pt-5 space-y-4">

                  {/* Payment options */}
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((method) => (
                      <label
                        key={method.value}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                          paymentMethod === method.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={() => setPaymentMethod(method.value)}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <div className="flex-1">
                          <p className={`font-semibold text-sm ${
                            paymentMethod === method.value
                              ? 'text-orange-700'
                              : 'text-gray-800'
                          }`}>
                            {method.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {method.description}
                          </p>
                        </div>
                        {paymentMethod === method.value && (
                          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* Info banners */}
                  {paymentMethod === 'razorpay' && (
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <span className="text-xl flex-shrink-0">💳</span>
                      <div>
                        <p className="font-semibold text-blue-800 text-sm">
                          Secure Online Payment
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          You'll be redirected to Razorpay's secure checkout.
                          Supports UPI, Credit/Debit Cards &amp; Net Banking.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <span className="text-xl flex-shrink-0">💵</span>
                      <div>
                        <p className="font-semibold text-yellow-800 text-sm">
                          Cash on Delivery
                        </p>
                        <p className="text-xs text-yellow-600 mt-0.5">
                          Please keep exact change of{' '}
                          <strong>{formatPrice(total)}</strong> ready.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Place order button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="btn-primary w-full btn-lg"
                  >
                    {paymentMethod === 'razorpay'
                      ? `💳 Pay ${formatPrice(total)}`
                      : `📦 Place Order — ${formatPrice(total)}`}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    By placing this order you agree to our Terms of Service
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div className="space-y-4">
            {/* Cart summary */}
            <CartSummary />

            {/* Items list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-orange-500" />
                {cartItems.length} Item{cartItems.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.cartId} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      🍕
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {item.size} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-700 flex-shrink-0">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery address preview (step 2) */}
            {step === 2 && address.street && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-orange-500" />
                    Delivering To
                  </h3>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-orange-500 font-semibold hover:text-orange-600"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-800">{address.name}</p>
                  <p>{address.phone}</p>
                  <p>{address.street}</p>
                  {address.landmark && (
                    <p className="text-gray-400">Near: {address.landmark}</p>
                  )}
                  <p>{address.city}, {address.state} - {address.pincode}</p>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="space-y-2.5">
                {[
                  { icon: '🔒', text: 'Secure payment via Razorpay' },
                  { icon: '⚡', text: 'Instant order confirmation'  },
                  { icon: '🛵', text: 'Live real-time order tracking'},
                  { icon: '🍕', text: 'Fresh hot pizza guaranteed'  },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">{b.icon}</span>
                    {b.text}
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

export default Checkout;