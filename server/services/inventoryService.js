const Inventory = require('../models/Inventory');

/**
 * Reduce inventory stock when an order is placed
 * @param {Array} orderItems - Items in the order
 */
const reduceInventoryForOrder = async (orderItems) => {
  const bulkOps = [];

  for (const item of orderItems) {
    const ingredients = [];

    if (item.itemType === 'preset' && item.customPizza) {
      // Collect all ingredient IDs from preset pizza
      if (item.customPizza.base)    ingredients.push(item.customPizza.base);
      if (item.customPizza.sauce)   ingredients.push(item.customPizza.sauce);
      if (item.customPizza.cheese)  ingredients.push(item.customPizza.cheese);
      if (item.customPizza.vegetables) {
        ingredients.push(...item.customPizza.vegetables);
      }
    } else if (item.itemType === 'custom') {
      if (item.customPizza.base)    ingredients.push(item.customPizza.base);
      if (item.customPizza.sauce)   ingredients.push(item.customPizza.sauce);
      if (item.customPizza.cheese)  ingredients.push(item.customPizza.cheese);
      if (item.customPizza.vegetables) {
        ingredients.push(...item.customPizza.vegetables);
      }
    }

    // Deduct stock for each ingredient × quantity ordered
    for (const ingredientId of ingredients) {
      bulkOps.push({
        updateOne: {
          filter: { _id: ingredientId, quantity: { $gte: item.quantity } },
          update: {
            $inc: { quantity: -item.quantity },
          },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await Inventory.bulkWrite(bulkOps);
  }

  // After reducing, check for items that now need to be marked unavailable
  await markUnavailableItems();
};

/**
 * Mark inventory items as unavailable when stock hits zero
 */
const markUnavailableItems = async () => {
  await Inventory.updateMany(
    { quantity: 0, isAvailable: true },
    { $set: { isAvailable: false } }
  );

  // Re-enable items that have been restocked
  await Inventory.updateMany(
    { quantity: { $gt: 0 }, isAvailable: false },
    { $set: { isAvailable: true, lowStockAlertSent: false } }
  );
};

/**
 * Restore inventory when an order is cancelled
 */
const restoreInventoryForOrder = async (orderItems) => {
  const bulkOps = [];

  for (const item of orderItems) {
    const ingredients = [];

    if (item.customPizza) {
      if (item.customPizza.base)    ingredients.push(item.customPizza.base);
      if (item.customPizza.sauce)   ingredients.push(item.customPizza.sauce);
      if (item.customPizza.cheese)  ingredients.push(item.customPizza.cheese);
      if (item.customPizza.vegetables) {
        ingredients.push(...item.customPizza.vegetables);
      }
    }

    for (const ingredientId of ingredients) {
      bulkOps.push({
        updateOne: {
          filter: { _id: ingredientId },
          update: { $inc: { quantity: item.quantity } },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await Inventory.bulkWrite(bulkOps);
    await markUnavailableItems();
  }
};

module.exports = {
  reduceInventoryForOrder,
  restoreInventoryForOrder,
  markUnavailableItems,
};