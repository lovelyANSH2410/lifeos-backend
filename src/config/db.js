import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.util.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      // These options are recommended for Mongoose 6+
      // No need for useNewUrlParser, useUnifiedTopology in newer versions
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
