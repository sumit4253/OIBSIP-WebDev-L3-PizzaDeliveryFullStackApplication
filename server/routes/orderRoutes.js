const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderAnalytics,
} = require('../controllers/orderController');

const { protect }      = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');
const validate         = require('../middleware/validateMiddleware');

const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.itemType')
    .isIn(['preset', 'custom']).withMessage('Item type must be preset or custom'),
  body('items.*.size')
    .isIn(['small', 'medium', 'large']).withMessage('Size must be small, medium, or large'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress.name').notEmpty().withMessage('Delivery name required'),
  body('deliveryAddress.phone').notEmpty().withMessage('Delivery phone required'),
  body('deliveryAddress.street').notEmpty().withMessage('Street address required'),
  body('deliveryAddress.city').notEmpty().withMessage('City required'),
  body('deliveryAddress.state').notEmpty().withMessage('State required'),
  body('deliveryAddress.pincode').notEmpty().withMessage('Pincode required'),
  body('payment.method')
    .isIn(['razorpay', 'cod']).withMessage('Payment method must be razorpay or cod'),
];

// ── User Routes ──
router.post('/',          protect, orderValidation, validate, placeOrder);
router.get('/my-orders',  protect, getMyOrders);
router.get('/:id',        protect, getOrderById);
router.patch('/:id/cancel', protect, cancelOrder);

// ── Admin Routes ──
router.get('/',                    adminProtect, getAllOrders);
router.get('/analytics/summary',   adminProtect, getOrderAnalytics);
router.patch('/:id/status',        adminProtect, updateOrderStatus);

module.exports = router;