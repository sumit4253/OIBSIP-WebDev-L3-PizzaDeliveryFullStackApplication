const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false,   // Never return password by default
    },
    phone: {
      type:  String,
      trim:  true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'],
    },
    address: {
      street:   { type: String, trim: true },
      city:     { type: String, trim: true },
      state:    { type: String, trim: true },
      pincode:  { type: String, trim: true },
      landmark: { type: String, trim: true },
    },
    avatar: {
      type:    String,
      default: '',
    },
    isEmailVerified: {
      type:    Boolean,
      default: false,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    role: {
      type:    String,
      enum:    ['user'],
      default: 'user',
    },
    refreshToken: {
      type:   String,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,   // Adds createdAt and updatedAt automatically
    toJSON: {
      transform: function (doc, ret) {
        // Remove sensitive fields when converting to JSON
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ===== INDEXES =====
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// ===== HOOKS =====

/**
 * Hash password before saving
 * Only hashes if password has been modified (not on every save)
 */
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// ===== METHODS =====

/**
 * Compare plain-text password with hashed password
 * @param {string} candidatePassword - The password to check
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Get public profile (excludes sensitive data)
 */
userSchema.methods.toPublicProfile = function () {
  return {
    _id:             this._id,
    name:            this.name,
    email:           this.email,
    phone:           this.phone,
    address:         this.address,
    avatar:          this.avatar,
    isEmailVerified: this.isEmailVerified,
    createdAt:       this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);
module.exports = User;