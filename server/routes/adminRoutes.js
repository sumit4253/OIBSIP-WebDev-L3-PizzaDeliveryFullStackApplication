const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');

const {
  adminRegister,
  adminLogin,
  adminRefreshToken,
  adminLogout,
  getAdminProfile,
} = require('../controllers/adminAuthController');

const { getAllUsers, toggleUserStatus, getUserStats } = require('../controllers/userController');
const { getOrderAnalytics, getAllOrders, updateOrderStatus } = require('../controllers/orderController');

const { adminProtect }  = require('../middleware/adminMiddleware');
const validate          = require('../middleware/validateMiddleware');
const { authLimiter }   = require('../middleware/rateLimiter');

// ── Auth Routes ──
router.post('/auth/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
  body('secretKey').notEmpty().withMessage('Secret key required'),
], validate, adminRegister);

router.post('/auth/login', authLimiter, [
  body('email').trim().isEmail(),
  body('password').notEmpty(),
], validate, adminLogin);

router.post('/auth/refresh-token', adminRefreshToken);
router.post('/auth/logout', adminProtect, adminLogout);
router.get('/auth/me',      adminProtect, getAdminProfile);

// ── User Management ──
router.get('/users',                    adminProtect, getAllUsers);
router.get('/users/stats',              adminProtect, getUserStats);
router.patch('/users/:id/toggle-status', adminProtect, toggleUserStatus);

// ── Order Management ──
router.get('/orders',            adminProtect, getAllOrders);
router.get('/orders/analytics',  adminProtect, getOrderAnalytics);
router.patch('/orders/:id/status', adminProtect, [
  body('status').notEmpty().withMessage('Status is required'),
], validate, updateOrderStatus);

module.exports = router;