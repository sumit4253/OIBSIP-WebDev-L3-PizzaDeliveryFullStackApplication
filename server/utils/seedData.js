require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Inventory = require('../models/Inventory');
const Pizza     = require('../models/Pizza');
const Admin     = require('../models/Admin');

const seedInventory = [
  // Bases
  { name: 'Classic White Base',    category: 'base',      price: 40,  quantity: 100, unit: 'pieces', threshold: 20, displayOrder: 1 },
  { name: 'Whole Wheat Base',      category: 'base',      price: 50,  quantity: 80,  unit: 'pieces', threshold: 15, displayOrder: 2 },
  { name: 'Thin Crust Base',       category: 'base',      price: 45,  quantity: 90,  unit: 'pieces', threshold: 20, displayOrder: 3 },
  { name: 'Multigrain Base',       category: 'base',      price: 60,  quantity: 60,  unit: 'pieces', threshold: 15, displayOrder: 4 },
  // Sauces
  { name: 'Classic Tomato Sauce',  category: 'sauce',     price: 20,  quantity: 150, unit: 'pieces', threshold: 30, displayOrder: 1 },
  { name: 'Pesto Sauce',           category: 'sauce',     price: 35,  quantity: 80,  unit: 'pieces', threshold: 20, displayOrder: 2 },
  { name: 'BBQ Sauce',             category: 'sauce',     price: 30,  quantity: 100, unit: 'pieces', threshold: 25, displayOrder: 3 },
  { name: 'White Garlic Sauce',    category: 'sauce',     price: 25,  quantity: 90,  unit: 'pieces', threshold: 20, displayOrder: 4 },
  // Cheeses
  { name: 'Mozzarella Cheese',     category: 'cheese',    price: 60,  quantity: 120, unit: 'pieces', threshold: 25, displayOrder: 1 },
  { name: 'Cheddar Cheese',        category: 'cheese',    price: 55,  quantity: 100, unit: 'pieces', threshold: 20, displayOrder: 2 },
  { name: 'Parmesan Cheese',       category: 'cheese',    price: 80,  quantity: 70,  unit: 'pieces', threshold: 15, displayOrder: 3 },
  { name: 'Vegan Cheese',          category: 'cheese',    price: 90,  quantity: 50,  unit: 'pieces', threshold: 10, displayOrder: 4 },
  // Vegetables
  { name: 'Bell Peppers',          category: 'vegetable', price: 15,  quantity: 200, unit: 'pieces', threshold: 40, displayOrder: 1 },
  { name: 'Mushrooms',             category: 'vegetable', price: 20,  quantity: 180, unit: 'pieces', threshold: 35, displayOrder: 2 },
  { name: 'Black Olives',          category: 'vegetable', price: 25,  quantity: 150, unit: 'pieces', threshold: 30, displayOrder: 3 },
  { name: 'Onions',                category: 'vegetable', price: 10,  quantity: 250, unit: 'pieces', threshold: 50, displayOrder: 4 },
  { name: 'Tomatoes',              category: 'vegetable', price: 12,  quantity: 220, unit: 'pieces', threshold: 45, displayOrder: 5 },
  { name: 'Jalapenos',             category: 'vegetable', price: 18,  quantity: 130, unit: 'pieces', threshold: 25, displayOrder: 6 },
  { name: 'Baby Corn',             category: 'vegetable', price: 22,  quantity: 160, unit: 'pieces', threshold: 30, displayOrder: 7 },
  { name: 'Spinach',               category: 'vegetable', price: 14,  quantity: 170, unit: 'pieces', threshold: 35, displayOrder: 8 },
];

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting seed...');

    // Clear existing data
    await Inventory.deleteMany({});
    await Pizza.deleteMany({});

    // Seed inventory
    const createdItems = await Inventory.insertMany(seedInventory);
    console.log(`✅ Created ${createdItems.length} inventory items`);

    // Get IDs for pizza creation
    const getItem = (name) => createdItems.find((i) => i.name === name)?._id;

    // Seed pizzas
    const pizzas = [
      {
        name:        'Margherita Classic',
        description: 'The timeless classic with fresh tomato sauce and mozzarella',
        category:    'veg',
        base:        getItem('Classic White Base'),
        sauce:       getItem('Classic Tomato Sauce'),
        cheese:      getItem('Mozzarella Cheese'),
        vegetables:  [getItem('Tomatoes')],
        price:       { small: 199, medium: 299, large: 399 },
        isFeatured:  true,
        preparationTime: 20,
        tags: ['classic', 'vegetarian', 'bestseller'],
      },
      {
        name:        'Garden Fresh',
        description: 'Loaded with garden-fresh vegetables on a whole wheat base',
        category:    'veg',
        base:        getItem('Whole Wheat Base'),
        sauce:       getItem('Classic Tomato Sauce'),
        cheese:      getItem('Mozzarella Cheese'),
        vegetables:  [getItem('Bell Peppers'), getItem('Mushrooms'), getItem('Onions'), getItem('Tomatoes')],
        price:       { small: 229, medium: 329, large: 449 },
        isFeatured:  true,
        preparationTime: 22,
        tags: ['healthy', 'vegetarian'],
      },
      {
        name:        'Spicy Inferno',
        description: 'For those who love the heat — packed with jalapeños and spicy sauce',
        category:    'veg',
        base:        getItem('Thin Crust Base'),
        sauce:       getItem('BBQ Sauce'),
        cheese:      getItem('Cheddar Cheese'),
        vegetables:  [getItem('Jalapenos'), getItem('Bell Peppers'), getItem('Onions')],
        price:       { small: 249, medium: 349, large: 469 },
        isFeatured:  true,
        preparationTime: 20,
        tags: ['spicy', 'vegetarian'],
      },
      {
        name:        'Pesto Paradise',
        description: 'Fragrant basil pesto with parmesan and garden vegetables',
        category:    'veg',
        base:        getItem('Multigrain Base'),
        sauce:       getItem('Pesto Sauce'),
        cheese:      getItem('Parmesan Cheese'),
        vegetables:  [getItem('Spinach'), getItem('Mushrooms'), getItem('Baby Corn')],
        price:       { small: 269, medium: 369, large: 489 },
        isFeatured:  false,
        preparationTime: 25,
        tags: ['premium', 'vegetarian'],
      },
      {
        name:        'BBQ Veggie Delight',
        description: 'Sweet and smoky BBQ sauce with a medley of fresh vegetables',
        category:    'veg',
        base:        getItem('Classic White Base'),
        sauce:       getItem('BBQ Sauce'),
        cheese:      getItem('Mozzarella Cheese'),
        vegetables:  [getItem('Bell Peppers'), getItem('Onions'), getItem('Baby Corn')],
        price:       { small: 239, medium: 339, large: 459 },
        isFeatured:  true,
        preparationTime: 20,
        tags: ['bbq', 'vegetarian'],
      },
      {
        name:        'Vegan Bliss',
        description: '100% plant-based with vegan cheese and organic vegetables',
        category:    'vegan',
        base:        getItem('Whole Wheat Base'),
        sauce:       getItem('Classic Tomato Sauce'),
        cheese:      getItem('Vegan Cheese'),
        vegetables:  [getItem('Spinach'), getItem('Bell Peppers'), getItem('Mushrooms'), getItem('Black Olives')],
        price:       { small: 279, medium: 389, large: 509 },
        isFeatured:  false,
        preparationTime: 22,
        tags: ['vegan', 'healthy', 'plant-based'],
      },
    ];

    const createdPizzas = await Pizza.insertMany(pizzas);
    console.log(`✅ Created ${createdPizzas.length} pizzas`);

    // Create default admin if not exists
    const existingAdmin = await Admin.findOne({ email: 'admin@pizzaapp.com' });
    if (!existingAdmin) {
      await Admin.create({
        name:      'Super Admin',
        email:     'admin@pizzaapp.com',
        password:  'Admin@1234',
        role:      'superadmin',
      });
      console.log('✅ Created default admin: admin@pizzaapp.com / Admin@1234');
    }

    console.log('');
    console.log('🌱 Seed completed successfully!');
    console.log('');
    console.log('Admin credentials:');
    console.log('  Email:    admin@pizzaapp.com');
    console.log('  Password: Admin@1234');
    console.log('');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();