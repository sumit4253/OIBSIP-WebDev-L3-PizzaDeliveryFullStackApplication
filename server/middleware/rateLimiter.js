const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter - applies to all /api routes
 * 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs:          15 * 60 * 1000,  // 15 minutes
  max:               100,
  standardHeaders:   true,
  legacyHeaders:     false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

/**
 * Strict rate limiter for auth routes
 * 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * OTP rate limiter
 * 3 OTP requests per 10 minutes per IP
 */
const otpLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             3,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 10 minutes.',
  },
});

module.exports = { globalLimiter, authLimiter, otpLimiter };