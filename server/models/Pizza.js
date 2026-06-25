const mongoose = require('mongoose');

/**
 * Pizza model for the menu (pre-built pizzas)
 * Custom built pizzas are constructed from Inventory items
 */
const pizzaSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Pizza name is required'],
      trim:     true,
      unique:   true,
    },
    description: {
      type:     String,
      required: [true, 'Description is required'],
      trim:     true,
    },
    image: {
      type:    String,
      default: '',
    },
    // Base ingredients that make up this pizza
    base:       { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    sauce:      { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    cheese:     { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    vegetables: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }],

    // Pricing for each size
    price: {
      small:  { type: Number, required: true, min: 0 },
      medium: { type: Number, required: true, min: 0 },
      large:  { type: Number, required: true, min: 0 },
    },
    category: {
      type:    String,
      enum:    ['veg', 'non-veg', 'vegan'],
      required: true,
    },
    isAvailable: {
      type:    Boolean,
      default: true,
    },
    isFeatured: {
      type:    Boolean,
      default: false,
    },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },
    tags: [{ type: String, trim: true }],
    preparationTime: {
      type:    Number,   // in minutes
      default: 20,
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
pizzaSchema.index({ category: 1 });
pizzaSchema.index({ isAvailable: 1 });
pizzaSchema.index({ isFeatured: 1 });
pizzaSchema.index({ 'ratings.average': -1 });

const Pizza = mongoose.model('Pizza', pizzaSchema);
module.exports = Pizza;