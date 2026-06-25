const crypto = require('crypto');

/**
 * Generate a cryptographically secure 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  // Generate 3 random bytes, convert to integer, modulo 1000000 for 6 digits
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

/**
 * Generate OTP expiry time
 * @param {number} minutes - Number of minutes until expiry (default: 10)
 * @returns {Date} Expiry date
 */
const generateOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = { generateOTP, generateOTPExpiry };