const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin:      [process.env.CLIENT_URL, 'http://localhost:5173'],
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // ===== Authentication Middleware for Socket =====
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ||
                  socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow unauthenticated connections (they won't see private events)
      socket.userId = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.role   = decoded.role || 'user';
      next();
    } catch (err) {
      socket.userId = null;
      next();
    }
  });

  // ===== Connection Handler =====
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.userId || 'anonymous'}`);

    // Join user-specific room for private events
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      console.log(`👤 User ${socket.userId} joined their room`);
    }

    // Admin joins admin room
    if (socket.role === 'admin') {
      socket.join('admin:room');
      console.log(`👑 Admin joined admin room`);
    }

    // ===== Order Room =====
    socket.on('join:order', (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`📦 Socket ${socket.id} joined order room: ${orderId}`);
      }
    });

    socket.on('leave:order', (orderId) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
      }
    });

    // ===== Disconnect =====
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });

    // ===== Error =====
    socket.on('error', (err) => {
      console.error(`❌ Socket error for ${socket.id}:`, err.message);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

/**
 * Emit order status update to all relevant parties
 * @param {string} orderId     - Order ID
 * @param {string} userId      - User ID who placed order
 * @param {Object} orderUpdate - Updated order data
 */
const emitOrderStatusUpdate = (orderId, userId, orderUpdate) => {
  if (!io) {
    console.warn('⚠️  Socket.IO not initialized');
    return;
  }

  // Emit to the specific order room (user tracking this order)
  io.to(`order:${orderId}`).emit('order:status_updated', orderUpdate);

  // Emit to user's personal room
  io.to(`user:${userId}`).emit('order:status_updated', orderUpdate);

  // Emit to admin room for real-time admin dashboard updates
  io.to('admin:room').emit('admin:order_updated', orderUpdate);

  console.log(`📡 Order status emitted for order ${orderId}: ${orderUpdate.status}`);
};

/**
 * Emit new order notification to all admins
 */
const emitNewOrder = (orderData) => {
  if (!io) return;
  io.to('admin:room').emit('admin:new_order', orderData);
};

/**
 * Emit low stock alert to admins
 */
const emitLowStockAlert = (inventoryItem) => {
  if (!io) return;
  io.to('admin:room').emit('admin:low_stock', inventoryItem);
};

/**
 * Get the initialized Socket.IO instance
 */
const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = {
  initSocket,
  emitOrderStatusUpdate,
  emitNewOrder,
  emitLowStockAlert,
  getIO,
};