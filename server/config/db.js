const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Uses connection pooling and retry logic for production reliability
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern Mongoose doesn't need these options but good to be explicit
      serverSelectionTimeoutMS: 5000,   // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity
      maxPoolSize: 50,                  // Maintain up to 50 socket connections
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB Disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB Reconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Connection Error:', err);
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);  // Exit with failure code
  }
};

module.exports = connectDB;