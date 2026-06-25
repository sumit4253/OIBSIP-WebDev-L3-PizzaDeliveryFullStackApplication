const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');

const {
  getAllInventory,
  getInventoryByCategory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  updateStock,
  deleteInventoryItem,
  getLowStockItems,
  updateThreshold,
} = require('../controllers/inventoryController');

const { adminProtect } = require('../middleware/adminMiddleware');
const upload           = require('../middleware/uploadMiddleware');
const validate         = require('../middleware/validateMiddleware');

const inventoryValidation = [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('category')
    .isIn(['base', 'sauce', 'cheese', 'vegetable', 'topping', 'other'])
    .withMessage('Invalid category'),
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity')
    .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('unit')
    .isIn(['kg', 'grams', 'liters', 'ml', 'pieces', 'packets'])
    .withMessage('Invalid unit'),
];

// ── Public Routes ──
router.get('/',                          getAllInventory);
router.get('/low-stock',                 adminProtect, getLowStockItems);
router.get('/category/:category',        getInventoryByCategory);
router.get('/:id',                       getInventoryById);

// ── Admin Routes ──
router.post('/',
  adminProtect,
  upload.single('image'),
  inventoryValidation,
  validate,
  createInventoryItem
);

router.put('/:id',
  adminProtect,
  upload.single('image'),
  updateInventoryItem
);

router.patch('/:id/stock', adminProtect, [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
  body('operation').isIn(['set', 'add', 'subtract']).withMessage('Invalid operation'),
], validate, updateStock);

router.patch('/:id/threshold', adminProtect, [
  body('threshold').isInt({ min: 0 }).withMessage('Threshold must be non-negative'),
], validate, updateThreshold);

router.delete('/:id', adminProtect, deleteInventoryItem);

module.exports = router;