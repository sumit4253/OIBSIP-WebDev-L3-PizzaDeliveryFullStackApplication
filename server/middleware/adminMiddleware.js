const { verifyAccessToken } = require('../services/tokenService');
const Admin                 = require('../models/Admin');
const ApiResponse           = require('../utils/apiResponse');
const asyncHandler          = require('../utils/asyncHandler');

/**
 * Protect admin routes — requires valid admin JWT
 */
const adminProtect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.cookies?.adminAccessToken) {
    token = req.cookies.adminAccessToken;
  }

  if (!token) {
    return ApiResponse.error(res, 401, 'Admin access denied. No token provided.');
  }

  const decoded = verifyAccessToken(token);

  if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
    return ApiResponse.error(res, 403, 'Not authorized as admin.');
  }

  const admin = await Admin.findById(decoded.id).select('-password -refreshToken');

  if (!admin) {
    return ApiResponse.error(res, 401, 'Admin not found. Please log in again.');
  }

  if (!admin.isActive) {
    return ApiResponse.error(res, 401, 'Admin account deactivated.');
  }

  req.admin = admin;
  next();
});

/**
 * Require superadmin role
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.admin?.role !== 'superadmin') {
    return ApiResponse.error(res, 403, 'Superadmin access required.');
  }
  next();
};

module.exports = { adminProtect, requireSuperAdmin };