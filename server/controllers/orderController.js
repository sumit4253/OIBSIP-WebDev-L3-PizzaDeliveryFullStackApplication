const Order       = require('../models/Order');
const Pizza       = require('../models/Pizza');
const Inventory   = require('../models/Inventory');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/apiResponse');
const { reduceInventoryForOrder, restoreInventoryForOrder } = require('../services/inventoryService');
const { sendOrderConfirmationEmail } = require('../services/emailServices');
const { emitOrderStatusUpdate, emitNewOrder } = require('../socket/socketHandler');

// ─────────────────────────────────────────
// @desc    Place a new order
// @route   POST /api/orders
// @access  Private
// ─────────────────────────────────────────
const placeOrder = asyncHandler(async (req, res) => {
  const {
    items,
    deliveryAddress,
    payment,
    specialInstructions,
    couponCode,
  } = req.body;

  if (!items || items.length === 0) {
    return ApiResponse.error(res, 400, 'Order must have at least one item.');
  }

  // ── Calculate pricing ──
  let subtotal = 0;

  const processedItems = [];

  for (const item of items) {
    let itemPrice = 0;
    let itemName  = '';

    if (item.itemType === 'preset') {
      const pizza = await Pizza.findById(item.pizza);
      if (!pizza || !pizza.isAvailable) {
        return ApiResponse.error(res, 400, `Pizza "${item.name}" is not available.`);
      }
      itemPrice = pizza.price[item.size];
      itemName  = pizza.name;
    } else if (item.itemType === 'custom') {
      // Calculate custom pizza price from ingredients
      const ingredientIds = [
        item.customPizza.base,
        item.customPizza.sauce,
        item.customPizza.cheese,
        ...(item.customPizza.vegetables || []),
      ].filter(Boolean);

      const ingredients = await Inventory.find({ _id: { $in: ingredientIds } });
      itemPrice = ingredients.reduce((sum, ing) => sum + ing.price, 0);

      // Size multiplier
      const sizeMultiplier = { small: 1, medium: 1.5, large: 2 };
      itemPrice = Math.round(itemPrice * (sizeMultiplier[item.size] || 1));
      itemName  = item.name || 'Custom Pizza';
    }

    const subtotalItem = itemPrice * item.quantity;
    subtotal += subtotalItem;

    processedItems.push({
      ...item,
      name:     itemName,
      price:    itemPrice,
      subtotal: subtotalItem,
    });
  }

  const deliveryFee = subtotal >= 500 ? 0 : 40;     // Free delivery above ₹500
  const tax         = Math.round(subtotal * 0.18);   // 18% GST
  const discount    = 0;                              // Coupon logic can be added
  const total       = subtotal + deliveryFee + tax - discount;

  // ── Create order ──
  const order = await Order.create({
    user:    req.user._id,
    items:   processedItems,
    deliveryAddress,
    pricing: { subtotal, deliveryFee, tax, discount, total },
    payment: {
      method: payment.method,
      status: payment.method === 'cod' ? 'pending' : 'pending',
      razorpayOrderId: payment.razorpayOrderId || undefined,
    },
    specialInstructions,
    couponCode,
  });

  // ── Reduce inventory ──
  try {
    await reduceInventoryForOrder(processedItems);
  } catch (err) {
    console.error('Inventory reduction error:', err.message);
  }

  // ── Populate order for response ──
  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'name email phone')
    .populate('items.pizza', 'name image')
    .populate('items.customPizza.base items.customPizza.sauce items.customPizza.cheese items.customPizza.vegetables', 'name');

  // ── Send confirmation email ──
  try {
    await sendOrderConfirmationEmail(
      req.user.email,
      req.user.name,
      populatedOrder
    );
  } catch (err) {
    console.error('Order email error:', err.message);
  }

  // ── Notify admins via socket ──
  emitNewOrder({
    orderId:     order._id,
    orderNumber: order.orderNumber,
    total:       order.pricing.total,
    userName:    req.user.name,
    itemCount:   order.items.length,
    createdAt:   order.createdAt,
  });

  return ApiResponse.success(res, 201, 'Order placed successfully!', {
    order: populatedOrder,
  });
});

// ─────────────────────────────────────────
// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
// ─────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .populate('items.pizza', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  return ApiResponse.paginated(res, 'Orders fetched.', orders, {
    page, limit, total,
    pages: Math.ceil(total / limit),
  });
});

// ─────────────────────────────────────────
// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
// ─────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.pizza', 'name image category')
    .populate(
      'items.customPizza.base items.customPizza.sauce items.customPizza.cheese items.customPizza.vegetables',
      'name image price'
    );

  if (!order) {
    return ApiResponse.error(res, 404, 'Order not found.');
  }

  // Users can only see their own orders
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    !req.admin
  ) {
    return ApiResponse.error(res, 403, 'Not authorized to view this order.');
  }

  return ApiResponse.success(res, 200, 'Order fetched.', { order });
});

// ─────────────────────────────────────────
// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private (Admin)
// ─────────────────────────────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const page   = parseInt(req.query.page)   || 1;
  const limit  = parseInt(req.query.limit)  || 10;
  const skip   = (page - 1) * limit;
  const status = req.query.status;
  const search = req.query.search;

  const query = {};
  if (status) query.status = status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.pizza', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, 'All orders fetched.', orders, {
    page, limit, total,
    pages: Math.ceil(total / limit),
  });
});

// ─────────────────────────────────────────
// @desc    Update order status (Admin)
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin)
// ─────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const validStatuses = [
    'received', 'preparing', 'in_kitchen',
    'ready', 'out_for_delivery', 'delivered', 'cancelled',
  ];

  if (!validStatuses.includes(status)) {
    return ApiResponse.error(res, 400, 'Invalid order status.');
  }

  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    return ApiResponse.error(res, 404, 'Order not found.');
  }

  // Can't update cancelled or delivered orders
  if (['cancelled', 'delivered'].includes(order.status)) {
    return ApiResponse.error(
      res, 400,
      `Cannot update an order that is already ${order.status}.`
    );
  }

  const previousStatus = order.status;
  order.status = status;

  // Add to status history
  order.statusHistory.push({
    status,
    updatedAt: new Date(),
    updatedBy: req.admin?.name || 'admin',
    note:      note || '',
  });

  if (status === 'delivered') {
    order.deliveredAt = new Date();
    // Mark payment as paid for COD
    if (order.payment.method === 'cod') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
    }
  }

  if (status === 'cancelled') {
    order.cancelReason = note || 'Cancelled by admin';
    // Restore inventory
    try {
      await restoreInventoryForOrder(order.items);
    } catch (err) {
      console.error('Inventory restore error:', err.message);
    }
  }

  await order.save();

  // ── Emit real-time update ──
  const updatePayload = {
    orderId:     order._id,
    orderNumber: order.orderNumber,
    status:      order.status,
    statusHistory: order.statusHistory,
    updatedAt:   new Date(),
    note:        note || '',
  };

  emitOrderStatusUpdate(
    order._id.toString(),
    order.user._id.toString(),
    updatePayload
  );

  return ApiResponse.success(res, 200, `Order status updated to "${status}".`, {
    order: {
      _id:           order._id,
      orderNumber:   order.orderNumber,
      status:        order.status,
      statusHistory: order.statusHistory,
    },
  });
});

// ─────────────────────────────────────────
// @desc    Cancel order (User)
// @route   PATCH /api/orders/:id/cancel
// @access  Private
// ─────────────────────────────────────────
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findOne({
    _id:  req.params.id,
    user: req.user._id,
  });

  if (!order) {
    return ApiResponse.error(res, 404, 'Order not found.');
  }

  // Can only cancel if received or preparing
  if (!['received', 'preparing'].includes(order.status)) {
    return ApiResponse.error(
      res, 400,
      'Order cannot be cancelled at this stage. Please contact support.'
    );
  }

  order.status       = 'cancelled';
  order.cancelReason = reason || 'Cancelled by user';

  order.statusHistory.push({
    status:    'cancelled',
    updatedAt: new Date(),
    updatedBy: req.user.name,
    note:      reason || 'Cancelled by user',
  });

  await order.save();

  // Restore inventory
  try {
    await restoreInventoryForOrder(order.items);
  } catch (err) {
    console.error('Inventory restore error:', err.message);
  }

  return ApiResponse.success(res, 200, 'Order cancelled successfully.', {
    status: order.status,
  });
});

// ─────────────────────────────────────────
// @desc    Get order analytics (Admin)
// @route   GET /api/orders/analytics
// @access  Private (Admin)
// ─────────────────────────────────────────
const getOrderAnalytics = asyncHandler(async (req, res) => {
  const { period = '7' } = req.query;
  const days = parseInt(period);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    recentRevenue,
    statusBreakdown,
    dailyOrders,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'delivered' }),
    Order.countDocuments({ status: 'cancelled' }),

    // Total revenue (all time)
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),

    // Revenue in period
    Order.aggregate([
      {
        $match: {
          status:    'delivered',
          createdAt: { $gte: startDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),

    // Orders by status
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Daily orders for chart
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count:   { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return ApiResponse.success(res, 200, 'Analytics fetched.', {
    summary: {
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      pendingOrders: totalOrders - deliveredOrders - cancelledOrders,
      totalRevenue:  totalRevenue[0]?.total  || 0,
      recentRevenue: recentRevenue[0]?.total || 0,
    },
    statusBreakdown,
    dailyOrders,
  });
});

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderAnalytics,
};