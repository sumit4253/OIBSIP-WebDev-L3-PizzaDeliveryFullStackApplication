const Inventory   = require('../models/Inventory');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/apiResponse');
const cloudinary   = require('../config/cloudinary');
const fs           = require('fs');

// ─────────────────────────────────────────
// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Public (for pizza builder)
// ─────────────────────────────────────────
const getAllInventory = asyncHandler(async (req, res) => {
  const { category, available } = req.query;

  const query = {};
  if (category)  query.category    = category;
  if (available !== undefined) {
    query.isAvailable = available === 'true';
  }

  const items = await Inventory.find(query)
    .sort({ category: 1, displayOrder: 1, name: 1 });

  // Group by category for pizza builder
  const grouped = {
    base:      [],
    sauce:     [],
    cheese:    [],
    vegetable: [],
    topping:   [],
    other:     [],
  };

  items.forEach((item) => {
    if (grouped[item.category] !== undefined) {
      grouped[item.category].push(item);
    }
  });

  return ApiResponse.success(res, 200, 'Inventory fetched.', {
    items,
    grouped,
    total: items.length,
  });
});

// ─────────────────────────────────────────
// @desc    Get inventory by category
// @route   GET /api/inventory/category/:category
// @access  Public
// ─────────────────────────────────────────
const getInventoryByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const validCategories = ['base', 'sauce', 'cheese', 'vegetable', 'topping', 'other'];
  if (!validCategories.includes(category)) {
    return ApiResponse.error(res, 400, 'Invalid category.');
  }

  const items = await Inventory.find({ category, isAvailable: true })
    .sort({ displayOrder: 1, name: 1 });

  return ApiResponse.success(res, 200, `${category} items fetched.`, { items });
});

// ─────────────────────────────────────────
// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Public
// ─────────────────────────────────────────
const getInventoryById = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    return ApiResponse.error(res, 404, 'Inventory item not found.');
  }

  return ApiResponse.success(res, 200, 'Item fetched.', { item });
});

// ─────────────────────────────────────────
// @desc    Create inventory item (Admin)
// @route   POST /api/inventory
// @access  Private (Admin)
// ─────────────────────────────────────────
const createInventoryItem = asyncHandler(async (req, res) => {
  const {
    name, category, description, price,
    quantity, unit, threshold,
    consumptionPerPizza, displayOrder,
  } = req.body;

  // Check duplicate name
  const existing = await Inventory.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (existing) {
    return ApiResponse.error(res, 400, 'An item with this name already exists.');
  }

  let imageUrl = '';
  if (req.file) {
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pizza-app/inventory',
          transformation: [{ width: 300, height: 300, crop: 'fill' }],
        });
        imageUrl = result.secure_url;
        fs.unlinkSync(req.file.path);
      } else {
        imageUrl = `/uploads/${req.file.filename}`;
      }
    } catch (err) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
  }

  const item = await Inventory.create({
    name,
    category,
    description,
    price:               parseFloat(price),
    quantity:            parseInt(quantity),
    unit,
    threshold:           parseInt(threshold) || 10,
    image:               imageUrl,
    consumptionPerPizza: parseFloat(consumptionPerPizza) || 1,
    displayOrder:        parseInt(displayOrder) || 0,
  });

  return ApiResponse.success(res, 201, 'Inventory item created.', { item });
});

// ─────────────────────────────────────────
// @desc    Update inventory item (Admin)
// @route   PUT /api/inventory/:id
// @access  Private (Admin)
// ─────────────────────────────────────────
const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    return ApiResponse.error(res, 404, 'Inventory item not found.');
  }

  const {
    name, category, description, price,
    quantity, unit, threshold,
    consumptionPerPizza, displayOrder, isAvailable,
  } = req.body;

  if (req.file) {
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pizza-app/inventory',
          transformation: [{ width: 300, height: 300, crop: 'fill' }],
        });
        item.image = result.secure_url;
        fs.unlinkSync(req.file.path);
      } else {
        item.image = `/uploads/${req.file.filename}`;
      }
    } catch (err) {
      item.image = `/uploads/${req.file.filename}`;
    }
  }

  if (name)               item.name               = name;
  if (category)           item.category           = category;
  if (description)        item.description        = description;
  if (price !== undefined)     item.price          = parseFloat(price);
  if (quantity !== undefined)  item.quantity       = parseInt(quantity);
  if (unit)               item.unit               = unit;
  if (threshold !== undefined) item.threshold      = parseInt(threshold);
  if (consumptionPerPizza !== undefined) item.consumptionPerPizza = parseFloat(consumptionPerPizza);
  if (displayOrder !== undefined) item.displayOrder = parseInt(displayOrder);
  if (isAvailable !== undefined) item.isAvailable  = isAvailable === 'true' || isAvailable === true;

  // Reset low stock alert if quantity was increased above threshold
  if (quantity && parseInt(quantity) > item.threshold) {
    item.lowStockAlertSent = false;
  }

  await item.save();

  return ApiResponse.success(res, 200, 'Inventory item updated.', { item });
});

// ─────────────────────────────────────────
// @desc    Update stock quantity only (Admin)
// @route   PATCH /api/inventory/:id/stock
// @access  Private (Admin)
// ─────────────────────────────────────────
const updateStock = asyncHandler(async (req, res) => {
  const { quantity, operation } = req.body;
  // operation: 'set' | 'add' | 'subtract'

  const item = await Inventory.findById(req.params.id);
  if (!item) {
    return ApiResponse.error(res, 404, 'Item not found.');
  }

  const qty = parseInt(quantity);

  if (operation === 'add') {
    item.quantity += qty;
  } else if (operation === 'subtract') {
    item.quantity = Math.max(0, item.quantity - qty);
  } else {
    // Default: set
    item.quantity = qty;
  }

  // Reset alert if restocked
  if (item.quantity > item.threshold) {
    item.lowStockAlertSent = false;
    item.isAvailable       = true;
  }

  if (item.quantity === 0) {
    item.isAvailable = false;
  }

  await item.save();

  return ApiResponse.success(res, 200, 'Stock updated.', {
    item,
    stockStatus: item.stockStatus,
  });
});

// ─────────────────────────────────────────
// @desc    Delete inventory item (Admin)
// @route   DELETE /api/inventory/:id
// @access  Private (Admin)
// ─────────────────────────────────────────
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    return ApiResponse.error(res, 404, 'Inventory item not found.');
  }

  await Inventory.deleteOne({ _id: req.params.id });

  return ApiResponse.success(res, 200, 'Inventory item deleted.');
});

// ─────────────────────────────────────────
// @desc    Get low stock items (Admin)
// @route   GET /api/inventory/low-stock
// @access  Private (Admin)
// ─────────────────────────────────────────
const getLowStockItems = asyncHandler(async (req, res) => {
  const items = await Inventory.find({
    $expr: { $lte: ['$quantity', '$threshold'] },
  }).sort({ quantity: 1 });

  return ApiResponse.success(res, 200, 'Low stock items fetched.', {
    items,
    count: items.length,
  });
});

// ─────────────────────────────────────────
// @desc    Update threshold (Admin)
// @route   PATCH /api/inventory/:id/threshold
// @access  Private (Admin)
// ─────────────────────────────────────────
const updateThreshold = asyncHandler(async (req, res) => {
  const { threshold } = req.body;

  const item = await Inventory.findByIdAndUpdate(
    req.params.id,
    { threshold: parseInt(threshold) },
    { new: true, runValidators: true }
  );

  if (!item) {
    return ApiResponse.error(res, 404, 'Item not found.');
  }

  return ApiResponse.success(res, 200, 'Threshold updated.', { item });
});

module.exports = {
  getAllInventory,
  getInventoryByCategory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  updateStock,
  deleteInventoryItem,
  getLowStockItems,
  updateThreshold,
};