const Pizza       = require('../models/Pizza');
const Inventory   = require('../models/Inventory');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/apiResponse');
const cloudinary   = require('../config/cloudinary');
const fs           = require('fs');

// ─────────────────────────────────────────
// @desc    Get all pizzas (public menu)
// @route   GET /api/pizzas
// @access  Public
// ─────────────────────────────────────────
const getAllPizzas = asyncHandler(async (req, res) => {
  const { category, available, featured, page = 1, limit = 20 } = req.query;

  const query = {};
  if (category)  query.category    = category;
  if (available) query.isAvailable = available === 'true';
  if (featured)  query.isFeatured  = featured  === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [pizzas, total] = await Promise.all([
    Pizza.find(query)
      .populate('base',       'name price image')
      .populate('sauce',      'name price image')
      .populate('cheese',     'name price image')
      .populate('vegetables', 'name price image')
      .sort({ isFeatured: -1, 'ratings.average': -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Pizza.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, 'Pizzas fetched successfully.', pizzas, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// ─────────────────────────────────────────
// @desc    Get single pizza by ID
// @route   GET /api/pizzas/:id
// @access  Public
// ─────────────────────────────────────────
const getPizzaById = asyncHandler(async (req, res) => {
  const pizza = await Pizza.findById(req.params.id)
    .populate('base',       'name price image isAvailable')
    .populate('sauce',      'name price image isAvailable')
    .populate('cheese',     'name price image isAvailable')
    .populate('vegetables', 'name price image isAvailable');

  if (!pizza) {
    return ApiResponse.error(res, 404, 'Pizza not found.');
  }

  return ApiResponse.success(res, 200, 'Pizza fetched.', { pizza });
});

// ─────────────────────────────────────────
// @desc    Get featured pizzas
// @route   GET /api/pizzas/featured
// @access  Public
// ─────────────────────────────────────────
const getFeaturedPizzas = asyncHandler(async (req, res) => {
  const pizzas = await Pizza.find({ isFeatured: true, isAvailable: true })
    .populate('base sauce cheese vegetables', 'name price')
    .limit(6);

  return ApiResponse.success(res, 200, 'Featured pizzas fetched.', { pizzas });
});

// ─────────────────────────────────────────
// @desc    Create pizza (Admin)
// @route   POST /api/pizzas
// @access  Private (Admin)
// ─────────────────────────────────────────
const createPizza = asyncHandler(async (req, res) => {
  const {
    name, description, base, sauce, cheese,
    vegetables, price, category, tags,
    preparationTime, isFeatured,
  } = req.body;

  // Parse price if sent as JSON string
  const parsedPrice = typeof price === 'string' ? JSON.parse(price) : price;
  const parsedVegs  = typeof vegetables === 'string' ? JSON.parse(vegetables) : vegetables;

  let imageUrl = '';
  if (req.file) {
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pizza-app/pizzas',
          transformation: [{ width: 600, height: 600, crop: 'fill' }],
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

  const pizza = await Pizza.create({
    name,
    description,
    image: imageUrl,
    base,
    sauce,
    cheese,
    vegetables: parsedVegs || [],
    price:      parsedPrice,
    category,
    tags:       tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
    preparationTime: preparationTime || 20,
    isFeatured: isFeatured === 'true' || isFeatured === true,
  });

  return ApiResponse.success(res, 201, 'Pizza created successfully.', { pizza });
});

// ─────────────────────────────────────────
// @desc    Update pizza (Admin)
// @route   PUT /api/pizzas/:id
// @access  Private (Admin)
// ─────────────────────────────────────────
const updatePizza = asyncHandler(async (req, res) => {
  const pizza = await Pizza.findById(req.params.id);
  if (!pizza) {
    return ApiResponse.error(res, 404, 'Pizza not found.');
  }

  const {
    name, description, base, sauce, cheese,
    vegetables, price, category, tags,
    preparationTime, isFeatured, isAvailable,
  } = req.body;

  const parsedPrice = price
    ? (typeof price === 'string' ? JSON.parse(price) : price)
    : pizza.price;

  const parsedVegs = vegetables
    ? (typeof vegetables === 'string' ? JSON.parse(vegetables) : vegetables)
    : pizza.vegetables;

  // Handle image update
  if (req.file) {
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pizza-app/pizzas',
          transformation: [{ width: 600, height: 600, crop: 'fill' }],
        });
        pizza.image = result.secure_url;
        fs.unlinkSync(req.file.path);
      } else {
        pizza.image = `/uploads/${req.file.filename}`;
      }
    } catch (err) {
      pizza.image = `/uploads/${req.file.filename}`;
    }
  }

  pizza.name            = name            || pizza.name;
  pizza.description     = description     || pizza.description;
  pizza.base            = base            || pizza.base;
  pizza.sauce           = sauce           || pizza.sauce;
  pizza.cheese          = cheese          || pizza.cheese;
  pizza.vegetables      = parsedVegs;
  pizza.price           = parsedPrice;
  pizza.category        = category        || pizza.category;
  pizza.preparationTime = preparationTime || pizza.preparationTime;
  pizza.isFeatured      = isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : pizza.isFeatured;
  pizza.isAvailable     = isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : pizza.isAvailable;

  if (tags) {
    pizza.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
  }

  await pizza.save();

  return ApiResponse.success(res, 200, 'Pizza updated successfully.', { pizza });
});

// ─────────────────────────────────────────
// @desc    Delete pizza (Admin)
// @route   DELETE /api/pizzas/:id
// @access  Private (Admin)
// ─────────────────────────────────────────
const deletePizza = asyncHandler(async (req, res) => {
  const pizza = await Pizza.findById(req.params.id);
  if (!pizza) {
    return ApiResponse.error(res, 404, 'Pizza not found.');
  }

  await Pizza.deleteOne({ _id: req.params.id });

  return ApiResponse.success(res, 200, 'Pizza deleted successfully.');
});

// ─────────────────────────────────────────
// @desc    Toggle pizza availability (Admin)
// @route   PATCH /api/pizzas/:id/toggle
// @access  Private (Admin)
// ─────────────────────────────────────────
const togglePizzaAvailability = asyncHandler(async (req, res) => {
  const pizza = await Pizza.findById(req.params.id);
  if (!pizza) {
    return ApiResponse.error(res, 404, 'Pizza not found.');
  }

  pizza.isAvailable = !pizza.isAvailable;
  await pizza.save();

  return ApiResponse.success(
    res, 200,
    `Pizza ${pizza.isAvailable ? 'enabled' : 'disabled'} successfully.`,
    { isAvailable: pizza.isAvailable }
  );
});

module.exports = {
  getAllPizzas,
  getPizzaById,
  getFeaturedPizzas,
  createPizza,
  updatePizza,
  deletePizza,
  togglePizzaAvailability,
};