const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type:     String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type:     String,
      required: true,
    },
    type: {
      type:    String,
      enum:    ['email_verification', 'password_reset'],
      required: true,
    },
    expiresAt: {
      type:     Date,
      required: true,
    },
    isUsed: {
      type:    Boolean,
      default: false,
    },
    attempts: {
      type:    Number,
      default: 0,
      max:     [5, 'Too many attempts'],
    },
  },
  {
    timestamps: true,
  }
);

// ===== INDEXES =====
// TTL index: automatically delete documents after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, type: 1 });

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;