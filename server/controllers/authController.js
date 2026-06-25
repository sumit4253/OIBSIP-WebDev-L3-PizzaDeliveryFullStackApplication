const User        = require('../models/User');
const OTP         = require('../models/OTP');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/apiResponse');
const { generateOTP, generateOTPExpiry } = require('../utils/generateOTP');
const {
  generateTokenPair,
  verifyRefreshToken,
  refreshTokenCookieOptions,
} = require('../services/tokenService');
const {
  sendVerificationEmail,
  sendForgotPasswordEmail,
} = require('../services/emailServices');

// ─────────────────────────────────────────
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (!existingUser.isEmailVerified) {
      // Resend OTP if not verified
      await OTP.deleteMany({ email, type: 'email_verification' });
      const otp = generateOTP();
      await OTP.create({
        email,
        otp,
        type:      'email_verification',
        expiresAt: generateOTPExpiry(10),
      });
      await sendVerificationEmail(email, existingUser.name, otp);
      return ApiResponse.success(
        res, 200,
        'Account exists but not verified. A new OTP has been sent to your email.'
      );
    }
    return ApiResponse.error(res, 400, 'Email already registered. Please login.');
  }

  // Create user
  const user = await User.create({ name, email, password, phone });

  // Generate and send OTP
  const otp = generateOTP();
  await OTP.create({
    email,
    otp,
    type:      'email_verification',
    expiresAt: generateOTPExpiry(10),
  });

  await sendVerificationEmail(email, name, otp);

  return ApiResponse.success(res, 201,
    'Registration successful! Please check your email for the verification OTP.',
    { email }
  );
});

// ─────────────────────────────────────────
// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
// ─────────────────────────────────────────
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Find valid OTP
  const otpRecord = await OTP.findOne({
    email,
    type:   'email_verification',
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    return ApiResponse.error(res, 400, 'Invalid or expired OTP. Please request a new one.');
  }

  if (otpRecord.otp !== otp) {
    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return ApiResponse.error(res, 400, 'Too many wrong attempts. Please request a new OTP.');
    }

    return ApiResponse.error(
      res, 400,
      `Incorrect OTP. ${5 - otpRecord.attempts} attempts remaining.`
    );
  }

  // Mark OTP as used
  otpRecord.isUsed = true;
  await otpRecord.save();

  // Verify user
  const user = await User.findOneAndUpdate(
    { email },
    { isEmailVerified: true },
    { new: true }
  );

  if (!user) {
    return ApiResponse.error(res, 404, 'User not found.');
  }

  // Generate tokens and log user in
  const { accessToken, refreshToken } = generateTokenPair({
    id:   user._id,
    role: 'user',
  });

  // Save refresh token to DB
  user.refreshToken = refreshToken;
  user.lastLogin    = new Date();
  await user.save({ validateBeforeSave: false });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  return ApiResponse.success(res, 200, 'Email verified successfully! Welcome to Pizza App.', {
    accessToken,
    user: user.toPublicProfile(),
  });
});

// ─────────────────────────────────────────
// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
// ─────────────────────────────────────────
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return ApiResponse.error(res, 404, 'No account found with this email.');
  }

  if (user.isEmailVerified) {
    return ApiResponse.error(res, 400, 'Email is already verified.');
  }

  // Delete existing OTPs
  await OTP.deleteMany({ email, type: 'email_verification' });

  const otp = generateOTP();
  await OTP.create({
    email,
    otp,
    type:      'email_verification',
    expiresAt: generateOTPExpiry(10),
  });

  await sendVerificationEmail(email, user.name, otp);

  return ApiResponse.success(res, 200, 'A new OTP has been sent to your email.');
});

// ─────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password (select: false by default)
  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user) {
    return ApiResponse.error(res, 401, 'Invalid email or password.');
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return ApiResponse.error(res, 401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    return ApiResponse.error(res, 401, 'Your account has been deactivated. Please contact support.');
  }

  if (!user.isEmailVerified) {
    // Send new OTP
    await OTP.deleteMany({ email, type: 'email_verification' });
    const otp = generateOTP();
    await OTP.create({
      email,
      otp,
      type:      'email_verification',
      expiresAt: generateOTPExpiry(10),
    });
    await sendVerificationEmail(email, user.name, otp);

    return ApiResponse.error(
      res, 403,
      'Email not verified. A new OTP has been sent to your email.'
    );
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair({
    id:   user._id,
    role: 'user',
  });

  // Save refresh token
  user.refreshToken = refreshToken;
  user.lastLogin    = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  return ApiResponse.success(res, 200, 'Login successful!', {
    accessToken,
    user: user.toPublicProfile(),
  });
});

// ─────────────────────────────────────────
// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
// ─────────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookie or body
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return ApiResponse.error(res, 401, 'No refresh token provided.');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(token);

  // Find user and verify token matches
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== token) {
    return ApiResponse.error(res, 401, 'Invalid refresh token. Please login again.');
  }

  // Generate new token pair (token rotation)
  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
    id:   user._id,
    role: 'user',
  });

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions);

  return ApiResponse.success(res, 200, 'Token refreshed.', { accessToken });
});

// ─────────────────────────────────────────
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });

  // Clear cookie
  res.cookie('refreshToken', '', {
    ...refreshTokenCookieOptions,
    maxAge: 0,
  });

  return ApiResponse.success(res, 200, 'Logged out successfully.');
});

// ─────────────────────────────────────────
// @desc    Forgot password — send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return ApiResponse.success(
      res, 200,
      'If an account exists with this email, you will receive a password reset OTP.'
    );
  }

  // Delete existing reset OTPs
  await OTP.deleteMany({ email, type: 'password_reset' });

  const otp = generateOTP();
  await OTP.create({
    email,
    otp,
    type:      'password_reset',
    expiresAt: generateOTPExpiry(10),
  });

  await sendForgotPasswordEmail(email, user.name, otp);

  return ApiResponse.success(
    res, 200,
    'If an account exists with this email, you will receive a password reset OTP.'
  );
});

// ─────────────────────────────────────────
// @desc    Verify reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
// ─────────────────────────────────────────
const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await OTP.findOne({
    email,
    type:      'password_reset',
    isUsed:    false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord || otpRecord.otp !== otp) {
    return ApiResponse.error(res, 400, 'Invalid or expired OTP.');
  }

  // Mark as used
  otpRecord.isUsed = true;
  await otpRecord.save();

  return ApiResponse.success(res, 200, 'OTP verified. You can now reset your password.', {
    email,
    resetToken: Buffer.from(`${email}:${Date.now()}`).toString('base64'),
  });
});

// ─────────────────────────────────────────
// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
// ─────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Verify OTP is used (already verified step)
  const otpRecord = await OTP.findOne({
    email,
    type:   'password_reset',
    isUsed: true,
  });

  if (!otpRecord) {
    return ApiResponse.error(res, 400, 'Please verify your OTP first.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return ApiResponse.error(res, 404, 'User not found.');
  }

  // Update password (pre-save hook will hash it)
  user.password = newPassword;
  // Invalidate all sessions
  user.refreshToken = undefined;
  await user.save();

  // Clean up OTP
  await OTP.deleteMany({ email, type: 'password_reset' });

  // Clear cookie
  res.cookie('refreshToken', '', { ...refreshTokenCookieOptions, maxAge: 0 });

  return ApiResponse.success(res, 200, 'Password reset successful! Please login with your new password.');
});

module.exports = {
  register,
  verifyEmail,
  resendOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
};