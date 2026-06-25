require('dotenv').config();
const express     = require('express');
const http        = require('http');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const cookieParser = require('cookie-parser');
const path        = require('path');

const connectDB          = require('./config/db');
const { initSocket }     = require('./socket/socketHandler');
const { startCronJobs }  = require('./cron/stockChecker');
const errorMiddleware    = require('./middleware/errorMiddleware');
const { globalLimiter } = require('./middleware/rateLimiter');

// ===== Route Imports =====
const authRoutes      = require('./routes/authRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const pizzaRoutes     = require('./routes/pizzaRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes     = require('./routes/orderRoutes');
const paymentRoutes   = require('./routes/paymentRoutes');
const userRoutes      = require('./routes/userRoutes');

// ===== App Initialization =====
const app    = express();
const server = http.createServer(app);  // Needed for Socket.IO

// ===== Connect to Database =====
connectDB();

// ===== Initialize Socket.IO =====
initSocket(server);

// ===== Security Middleware =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,  // Disable CSP for API server
}));

// ===== CORS Configuration =====
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,    // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('/{*any}', cors(corsOptions));  // Handle preflight requests

// ===== Request Parsing =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ===== Logging =====
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ===== Static Files (for local uploads) =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Rate Limiting =====
app.use('/api', globalLimiter);

// ===== Health Check =====
app.get('/health', (req, res) => {
  res.status(200).json({
    status:    'OK',
    message:   'Pizza App API is running',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV,
  });
});

// ===== API Routes =====
app.use('/api/auth',      authRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/pizzas',    pizzaRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/payment',   paymentRoutes);
app.use('/api/users',     userRoutes);

// ===== 404 Handler =====
app.use('/{*any}', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ===== Global Error Handler (must be last middleware) =====
app.use(errorMiddleware);

// ===== Start Cron Jobs =====
startCronJobs();

// ===== Start Server =====
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('');
  console.log('🍕 ================================= 🍕');
  console.log(`   Pizza App API`);
  console.log(`   Running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('🍕 ================================= 🍕');
  console.log('');
});

// ===== Graceful Shutdown =====
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

module.exports = { app, server };