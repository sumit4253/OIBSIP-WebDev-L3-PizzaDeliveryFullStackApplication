const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');

const {
  register,
  verifyEmail,
  resendOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} = require('../controllers/authController');

const { protect }               = require('../middleware/authMiddleware');
const validate                  = require('../middleware/validateMiddleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

// ── Validation Rules ──
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and a number'),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian phone number'),
];

const loginValidation = [
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const otpValidation = [
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
];

const resetPasswordValidation = [
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and a number'),
];

// ── Routes ──

// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, validate, register);

// POST /api/auth/verify-email
router.post('/verify-email', otpValidation, validate, verifyEmail);

// POST /api/auth/resend-otp
router.post('/resend-otp', otpLimiter, [
  body('email').trim().isEmail().withMessage('Valid email required'),
], validate, resendOTP);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, validate, login);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api/auth/logout  (protected)
router.post('/logout', protect, logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', otpLimiter, [
  body('email').trim().isEmail().withMessage('Valid email required'),
], validate, forgotPassword);

// POST /api/auth/verify-reset-otp
router.post('/verify-reset-otp', otpValidation, validate, verifyResetOTP);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);

module.exports = router;