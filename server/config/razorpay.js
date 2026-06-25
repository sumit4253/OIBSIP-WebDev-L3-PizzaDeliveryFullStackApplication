const Razorpay = require('razorpay');

/**
 * Initialize Razorpay instance with credentials from environment variables
 * Uses test mode credentials during development
 */
const razorpayInstance = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;