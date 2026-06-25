const User        = require('../models/User');
const Order       = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/apiResponse');
const cloudinary   = require('../config/cloudinary');
const fs           = require('fs');

// ─────────────────────────────────────────
// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
// ─────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return ApiResponse.success(res, 200, 'Profile fetched.', {
    user: user.toPublicProfile(),
  });
});

// ─────────────────────────────────────────
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
// ─────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, address },
    { new: true, runValidators: true }
  );

  return ApiResponse.success(res, 200, 'Profile updated successfully.', {
    user: updatedUser.toPublicProfile(),
  });
});

// ─────────────────────────────────────────
// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
// ─────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isCorrect = await user.comparePassword(currentPassword);
  if (!isCorrect) {
    return ApiResponse.error(res, 400, 'Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  return ApiResponse.success(res, 200, 'Password changed successfully.');
});

// ─────────────────────────────────────────
// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
// ─────────────────────────────────────────
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 400, 'Please upload an image.');
  }

  let avatarUrl = '';

  try {
    // Try Cloudinary first
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder:         'pizza-app/avatars',
        transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
      });
      avatarUrl = result.secure_url;
      // Delete local file after upload
      fs.unlinkSync(req.file.path);
    } else {
      // Use local file URL
      avatarUrl = `/uploads/${req.file.filename}`;
    }
  } catch (err) {
    avatarUrl = `/uploads/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true }
  );

  return ApiResponse.success(res, 200, 'Avatar uploaded successfully.', {
    avatar: user.avatar,
  });
});

// ─────────────────────────────────────────
// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
// ─────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;
  const search = req.query.search || '';

  const query = search
    ? {
        $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, 'Users fetched.', users, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});

// ─────────────────────────────────────────
// @desc    Toggle user active status (Admin)
// @route   PATCH /api/users/:id/toggle-status
// @access  Private (Admin)
// ─────────────────────────────────────────
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return ApiResponse.error(res, 404, 'User not found.');
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(
    res, 200,
    `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
    { isActive: user.isActive }
  );
});

// ─────────────────────────────────────────
// @desc    Get dashboard stats (Admin)
// @route   GET /api/users/stats
// @access  Private (Admin)
// ─────────────────────────────────────────
const getUserStats = asyncHandler(async (req, res) => {
  const [total, active, verified, newThisMonth] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isEmailVerified: true }),
    User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),
  ]);

  return ApiResponse.success(res, 200, 'User stats fetched.', {
    total,
    active,
    verified,
    newThisMonth,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getAllUsers,
  toggleUserStatus,
  getUserStats,
};