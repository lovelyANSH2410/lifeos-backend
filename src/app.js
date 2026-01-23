import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import logger from './utils/logger.util.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import diaryRoutes from './modules/diary/diary.routes.js';
import subscriptionRoutes from './modules/subscriptions/subscription.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api/', apiLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Placeholder routes for future modules
app.use('/api/tasks', (req, res) => {
  res.status(200).json({ success: true, message: 'Tasks module - Coming soon' });
});
app.use('/api/expenses', (req, res) => {
  res.status(200).json({ success: true, message: 'Expenses module - Coming soon' });
});
app.use('/api/goals', (req, res) => {
  res.status(200).json({ success: true, message: 'Goals module - Coming soon' });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

export default app;
