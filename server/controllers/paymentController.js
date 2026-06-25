const crypto      = require('crypto');
const razorpay    = require('../config/razorpay');
const Order       = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/apiResponse');

// ─────────────────────────────────────────
// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
// ─────────────────────────────────────────
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;

  if (!amount || amount <= 0) {
    return ApiResponse.error(res, 400, 'Invalid amount.');
  }

  const options = {
    amount:   Math.round(amount * 100),  // Razorpay expects paise
    currency,
    receipt:  receipt || `receipt_${Date.now()}`,
    notes: {
      userId: req.user._id.toString(),
    },
  };

  const razorpayOrder = await razorpay.orders.create(options);

  return ApiResponse.success(res, 200, 'Razorpay order created.', {
    orderId:  razorpayOrder.id,
    amount:   razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key:      process.env.RAZORPAY_KEY_ID,
  });
});

// ─────────────────────────────────────────
// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private
// ─────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,   // Our app's order ID
  } = req.body;

  // ── Verify signature ──
  const body      = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return ApiResponse.error(res, 400, 'Payment verification failed. Invalid signature.');
  }

  // ── Update order payment status ──
  const order = await Order.findById(orderId);
  if (!order) {
    return ApiResponse.error(res, 404, 'Order not found.');
  }

  order.payment.status             = 'paid';
  order.payment.razorpayOrderId    = razorpay_order_id;
  order.payment.razorpayPaymentId  = razorpay_payment_id;
  order.payment.razorpaySignature  = razorpay_signature;
  order.payment.paidAt             = new Date();

  await order.save();

  return ApiResponse.success(res, 200, 'Payment verified successfully!', {
    paymentId: razorpay_payment_id,
    orderId:   order._id,
    status:    'paid',
  });
});

// ─────────────────────────────────────────
// @desc    Handle Razorpay webhook
// @route   POST /api/payment/webhook
// @access  Public (Razorpay server)
// ─────────────────────────────────────────
const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSecret    = process.env.RAZORPAY_WEBHOOK_SECRET;
  const webhookSignature = req.headers['x-razorpay-signature'];

  if (webhookSecret) {
    const body     = JSON.stringify(req.body);
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expected !== webhookSignature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }
  }

  const event = req.body.event;
  const paymentEntity = req.body.payload?.payment?.entity;

  if (event === 'payment.failed') {
    // Find order by razorpay order id and mark payment failed
    const orderId = paymentEntity?.order_id;
    if (orderId) {
      await Order.findOneAndUpdate(
        { 'payment.razorpayOrderId': orderId },
        { 'payment.status': 'failed' }
      );
    }
  }

  res.status(200).json({ success: true });
});

// ─────────────────────────────────────────
// @desc    Get payment details
// @route   GET /api/payment/:paymentId
// @access  Private
// ─────────────────────────────────────────
const getPaymentDetails = asyncHandler(async (req, res) => {
  const payment = await razorpay.payments.fetch(req.params.paymentId);

  return ApiResponse.success(res, 200, 'Payment details fetched.', { payment });
});

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  getPaymentDetails,
};