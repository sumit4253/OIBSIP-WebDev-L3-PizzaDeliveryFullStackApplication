const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');

const {
  getAllPizzas,
  getPizzaById,
  getFeaturedPizzas,
  createPizza,
  updatePizza,
  deletePizza,
  togglePizzaAvailability,
} = require('../controllers/pizzaController');

const { adminProtect } = require('../middleware/adminMiddleware');
const upload           = require('../middleware/uploadMiddleware');
const validate         = require('../middleware/validateMiddleware');

const pizzaValidation = [
  body('name').trim().notEmpty().withMessage('Pizza name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['veg', 'non-veg', 'vegan']).withMessage('Category must be veg, non-veg, or vegan'),
];

// ── Public Routes ──
router.get('/',          getAllPizzas);
router.get('/featured',  getFeaturedPizzas);
router.get('/:id',       getPizzaById);

// ── Admin Routes ──
router.post('/',
  adminProtect,
  upload.single('image'),
  pizzaValidation,
  validate,
  createPizza
);

router.put('/:id',
  adminProtect,
  upload.single('image'),
  updatePizza
);

router.delete('/:id',
  adminProtect,
  deletePizza
);

router.patch('/:id/toggle',
  adminProtect,
  togglePizzaAvailability
);

module.exports = router;