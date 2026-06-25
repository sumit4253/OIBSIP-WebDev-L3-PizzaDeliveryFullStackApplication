const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');

const {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  getPaymentDetails,
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');
const validate    = require('../middleware/validateMiddleware');

// POST /api/payment/create-order
router.post('/create-order', protect, [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
], validate, createRazorpayOrder);

// POST /api/payment/verify
router.post('/verify', protect, [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID required'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID required'),
  body('razorpay_signature').notEmpty().withMessage('Signature required'),
  body('orderId').notEmpty().withMessage('App order ID required'),
], validate, verifyPayment);

// POST /api/payment/webhook  (Razorpay calls this)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// GET /api/payment/:paymentId
router.get('/:paymentId', protect, getPaymentDetails);

module.exports = router;