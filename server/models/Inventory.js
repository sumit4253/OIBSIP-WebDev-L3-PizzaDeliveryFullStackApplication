const mongoose = require('mongoose');

/**
 * Inventory model for pizza ingredients
 * Tracks stock levels, thresholds, and categories
 */
const inventorySchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Item name is required'],
      trim:     true,
      unique:   true,
    },
    category: {
      type:    String,
      required: true,
      enum: ['base', 'sauce', 'cheese', 'vegetable', 'topping', 'other'],
    },
    description: {
      type:  String,
      trim:  true,
      default: '',
    },
    image: {
      type:    String,
      default: '',
    },
    // Price per unit in rupees
    price: {
      type:    Number,
      required: [true, 'Price is required'],
      min:     [0, 'Price cannot be negative'],
    },
    // Current stock quantity
    quantity: {
      type:    Number,
      required: [true, 'Quantity is required'],
      min:     [0, 'Quantity cannot be negative'],
      default: 0,
    },
    // Unit of measurement
    unit: {
      type:    String,
      required: true,
      enum:    ['kg', 'grams', 'liters', 'ml', 'pieces', 'packets'],
      default: 'pieces',
    },
    // Minimum stock before alert
    threshold: {
      type:    Number,
      required: true,
      default: 10,
      min:     [0, 'Threshold cannot be negative'],
    },
    // Whether item is currently available for selection
    isAvailable: {
      type:    Boolean,
      default: true,
    },
    // How much stock to deduct per pizza
    consumptionPerPizza: {
      type:    Number,
      default: 1,
    },
    // Alert sent flag (reset when stock is replenished)
    lowStockAlertSent: {
      type:    Boolean,
      default: false,
    },
    // For sorting/display order in builder
    displayOrder: {
      type:    Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ===== INDEXES =====
inventorySchema.index({ category: 1 });
inventorySchema.index({ isAvailable: 1 });
inventorySchema.index({ quantity: 1 });

// ===== VIRTUALS =====
inventorySchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.threshold;
});

inventorySchema.virtual('stockStatus').get(function () {
  if (this.quantity === 0)                 return 'out_of_stock';
  if (this.quantity <= this.threshold)     return 'low_stock';
  return 'in_stock';
});

// Enable virtuals in JSON output
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;