const cron      = require('node-cron');
const Inventory = require('../models/Inventory');
const { sendLowStockEmail } = require('../services/emailServices');
const { emitLowStockAlert } = require('../socket/socketHandler');

/**
 * Check all inventory items for low stock
 * Sends email + socket notification if below threshold
 */
const checkInventoryStock = async () => {
  try {
    console.log('🔍 Running inventory stock check...');

    // Find all items where quantity <= threshold and alert not yet sent
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$quantity', '$threshold'] },
      isAvailable: true,
    });

    if (lowStockItems.length === 0) {
      console.log('✅ All inventory levels are healthy');
      return;
    }

    console.log(`⚠️  Found ${lowStockItems.length} low-stock items`);

    // Filter items that haven't had an alert sent recently
    const itemsNeedingAlert = lowStockItems.filter(
      (item) => !item.lowStockAlertSent
    );

    if (itemsNeedingAlert.length === 0) {
      console.log('ℹ️  All low-stock alerts already sent');
      return;
    }

    // Send combined email for all low-stock items
    await sendLowStockEmail(itemsNeedingAlert);

    // Mark items as alert sent + emit socket events
    for (const item of itemsNeedingAlert) {
      // Emit real-time alert to admin dashboard
      emitLowStockAlert({
        _id:       item._id,
        name:      item.name,
        category:  item.category,
        quantity:  item.quantity,
        threshold: item.threshold,
        unit:      item.unit,
      });

      // Mark alert as sent so we don't spam
      await Inventory.findByIdAndUpdate(item._id, {
        lowStockAlertSent: true,
      });
    }

    console.log(`📧 Low stock alerts sent for ${itemsNeedingAlert.length} items`);

  } catch (error) {
    console.error('❌ Inventory check cron error:', error.message);
  }
};

/**
 * Start all cron jobs
 */
const startCronJobs = () => {
  // Run every hour: '0 * * * *'
  // For testing, can use '*/5 * * * *' (every 5 minutes)
  cron.schedule('0 * * * *', checkInventoryStock, {
    scheduled: true,
    timezone:  'Asia/Kolkata',  // IST timezone
  });

  console.log('✅ Cron jobs started: Stock checker runs every hour');

  // Optional: Run immediately on server start for initial check
  if (process.env.NODE_ENV === 'development') {
    checkInventoryStock();
  }
};

module.exports = { startCronJobs, checkInventoryStock };