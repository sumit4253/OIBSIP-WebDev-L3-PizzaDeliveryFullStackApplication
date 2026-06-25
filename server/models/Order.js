const mongoose = require('mongoose');

// Schema for a single item in the order
const orderItemSchema = new mongoose.Schema({
  // Either a pre-built pizza or 'custom'
  itemType: {
    type: String,
    enum: ['preset', 'custom'],
    required: true,
  },
  // For preset pizzas
  pizza: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Pizza',
  },
  // For custom built pizzas
  customPizza: {
    base:       { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    sauce:      { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    cheese:     { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    vegetables: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }],
  },
  name:     { type: String, required: true },
  size:     { type: String, enum: ['small', 'medium', 'large'], required: true },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
});

// Status history entry
const statusHistorySchema = new mongoose.Schema({
  status:    { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'system' },  // 'system' | admin name
  note:      { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    // Auto-generated order number for human readability
    orderNumber: {
      type:   String,
      unique: true,
    },
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    items: {
      type:     [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    deliveryAddress: {
      name:     { type: String, required: true },
      phone:    { type: String, required: true },
      street:   { type: String, required: true },
      city:     { type: String, required: true },
      state:    { type: String, required: true },
      pincode:  { type: String, required: true },
      landmark: { type: String, default: '' },
    },
    pricing: {
      subtotal:     { type: Number, required: true },
      deliveryFee:  { type: Number, default: 40 },
      tax:          { type: Number, required: true },
      discount:     { type: Number, default: 0 },
      total:        { type: Number, required: true },
    },
    status: {
      type:    String,
      enum:    ['received', 'preparing', 'in_kitchen', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'received',
    },
    statusHistory: [statusHistorySchema],
    payment: {
      method:          { type: String, enum: ['razorpay', 'cod'], required: true },
      status:          { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
      paidAt:          { type: Date },
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelReason: {
      type:    String,
      default: '',
    },
    specialInstructions: {
      type:    String,
      default: '',
      maxlength: 200,
    },
    couponCode: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ===== INDEXES =====
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'payment.razorpayOrderId': 1 });
orderSchema.index({ createdAt: -1 });

// ===== HOOKS =====

/**
 * Generate unique order number before saving
 * Format: PZA-YYYYMMDD-XXXXX
 */
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 90000) + 10000;
    this.orderNumber = `PZA-${dateStr}-${random}`;

    // Set estimated delivery time (45 minutes from now)
    this.estimatedDeliveryTime = new Date(Date.now() + 45 * 60 * 1000);

    // Initialize status history
    this.statusHistory = [{
      status:    'received',
      updatedAt: new Date(),
      updatedBy: 'system',
    }];
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;