const Admin       = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/apiResponse');
const {
  generateTokenPair,
  verifyRefreshToken,
  refreshTokenCookieOptions,
} = require('../services/tokenService');

// ─────────────────────────────────────────
// @desc    Register Admin (secret key required)
// @route   POST /api/admin/auth/register
// @access  Public (with secret key)
// ─────────────────────────────────────────
const adminRegister = asyncHandler(async (req, res) => {
  const { name, email, password, secretKey } = req.body;

  // Validate secret key
  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    return ApiResponse.error(res, 403, 'Invalid admin secret key.');
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return ApiResponse.error(res, 400, 'Admin with this email already exists.');
  }

  const admin = await Admin.create({ name, email, password });

  return ApiResponse.success(res, 201, 'Admin registered successfully.', {
    admin: {
      _id:   admin._id,
      name:  admin.name,
      email: admin.email,
      role:  admin.role,
    },
  });
});

// ─────────────────────────────────────────
// @desc    Admin Login
// @route   POST /api/admin/auth/login
// @access  Public
// ─────────────────────────────────────────
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email }).select('+password +refreshToken');

  if (!admin) {
    return ApiResponse.error(res, 401, 'Invalid email or password.');
  }

  const isPasswordCorrect = await admin.comparePassword(password);
  if (!isPasswordCorrect) {
    return ApiResponse.error(res, 401, 'Invalid email or password.');
  }

  if (!admin.isActive) {
    return ApiResponse.error(res, 401, 'Admin account deactivated.');
  }

  const { accessToken, refreshToken } = generateTokenPair({
    id:   admin._id,
    role: admin.role,
  });

  admin.refreshToken = refreshToken;
  admin.lastLogin    = new Date();
  await admin.save({ validateBeforeSave: false });

  res.cookie('adminRefreshToken', refreshToken, {
    ...refreshTokenCookieOptions,
    path: '/api/admin',
  });

  return ApiResponse.success(res, 200, 'Admin login successful!', {
    accessToken,
    admin: {
      _id:         admin._id,
      name:        admin.name,
      email:       admin.email,
      role:        admin.role,
      permissions: admin.permissions,
    },
  });
});

// ─────────────────────────────────────────
// @desc    Admin Refresh Token
// @route   POST /api/admin/auth/refresh-token
// @access  Public
// ─────────────────────────────────────────
const adminRefreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.adminRefreshToken || req.body?.refreshToken;

  if (!token) {
    return ApiResponse.error(res, 401, 'No refresh token provided.');
  }

  const decoded = verifyRefreshToken(token);

  if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
    return ApiResponse.error(res, 403, 'Not authorized as admin.');
  }

  const admin = await Admin.findById(decoded.id).select('+refreshToken');

  if (!admin || admin.refreshToken !== token) {
    return ApiResponse.error(res, 401, 'Invalid refresh token.');
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
    id:   admin._id,
    role: admin.role,
  });

  admin.refreshToken = newRefreshToken;
  await admin.save({ validateBeforeSave: false });

  res.cookie('adminRefreshToken', newRefreshToken, {
    ...refreshTokenCookieOptions,
    path: '/api/admin',
  });

  return ApiResponse.success(res, 200, 'Token refreshed.', { accessToken });
});

// ─────────────────────────────────────────
// @desc    Admin Logout
// @route   POST /api/admin/auth/logout
// @access  Private (Admin)
// ─────────────────────────────────────────
const adminLogout = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(req.admin._id, {
    $unset: { refreshToken: 1 },
  });

  res.cookie('adminRefreshToken', '', {
    ...refreshTokenCookieOptions,
    maxAge: 0,
    path:   '/api/admin',
  });

  return ApiResponse.success(res, 200, 'Admin logged out successfully.');
});

// ─────────────────────────────────────────
// @desc    Get admin profile
// @route   GET /api/admin/auth/me
// @access  Private (Admin)
// ─────────────────────────────────────────
const getAdminProfile = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 200, 'Admin profile fetched.', {
    admin: req.admin,
  });
});

module.exports = {
  adminRegister,
  adminLogin,
  adminRefreshToken,
  adminLogout,
  getAdminProfile,
};