const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');

const {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');
const upload      = require('../middleware/uploadMiddleware');
const validate    = require('../middleware/validateMiddleware');

// GET /api/users/profile
router.get('/profile', protect, getProfile);

// PUT /api/users/profile
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit phone number'),
], validate, updateProfile);

// PUT /api/users/change-password
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must have uppercase, lowercase and number'),
], validate, changePassword);

// POST /api/users/avatar
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;