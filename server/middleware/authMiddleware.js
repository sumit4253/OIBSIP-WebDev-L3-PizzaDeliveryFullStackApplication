const { verifyAccessToken }  = require('../services/tokenService');
const User                   = require('../models/User');
const ApiResponse            = require('../utils/apiResponse');
const asyncHandler           = require('../utils/asyncHandler');

/**
 * Protect routes — requires valid JWT access token
 * Extracts token from Authorization header: "Bearer <token>"
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Also check cookie (for browser clients)
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return ApiResponse.error(res, 401, 'Access denied. No token provided.');
  }

  // Verify token
  const decoded = verifyAccessToken(token);

  // Get fresh user from DB (ensures user still exists and is active)
  const user = await User.findById(decoded.id).select('-password -refreshToken');

  if (!user) {
    return ApiResponse.error(res, 401, 'User not found. Please log in again.');
  }

  if (!user.isActive) {
    return ApiResponse.error(res, 401, 'Your account has been deactivated. Please contact support.');
  }

  if (!user.isEmailVerified) {
    return ApiResponse.error(res, 403, 'Please verify your email address before accessing this resource.');
  }

  // Attach user to request
  req.user = user;
  next();
});

/**
 * Optional auth — attaches user if token present, doesn't block if not
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user    = await User.findById(decoded.id).select('-password -refreshToken');
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (err) {
      // Silently fail — user just won't be attached
    }
  }

  next();
});

module.exports = { protect, optionalAuth };