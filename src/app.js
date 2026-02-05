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
import userSubscriptionRoutes from './modules/subscription/subscription.routes.js';
import tripRoutes from './modules/trips/trip.routes.js';
import vaultRoutes from './modules/vault/vault.routes.js';
import vaultDocumentRoutes from './modules/vaultDocuments/vaultDocument.routes.js';
import ideaRoutes from './modules/ideas/idea.routes.js';
import giftingRoutes from './modules/gifting/gifting.routes.js';
import watchRoutes from './modules/watch/watch.routes.js';
import incomeRoutes from './modules/money/income/income.routes.js';
import fixedExpenseRoutes from './modules/money/fixedExpenses/fixedExpense.routes.js';
import transactionRoutes from './modules/money/transactions/transaction.routes.js';
import fundRoutes from './modules/money/funds/fund.routes.js';
import debtRoutes from './modules/money/debts/debt.routes.js';
import wishlistRoutes from './modules/money/wishlist/wishlist.routes.js';
import overviewRoutes from './modules/money/overview/overview.routes.js';
import { examRouter, subjectRouter, topicRouter } from './modules/exams/exam.routes.js';
import studyEventRoutes from './modules/studyEvents/studyEvent.routes.js';

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
app.use('/api/subscription', userSubscriptionRoutes);
app.use('/api/trips', tripRoutes);
// Mount more specific routes first to avoid route conflicts
app.use('/api/vault/documents', vaultDocumentRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/gifting', giftingRoutes);
app.use('/api/watch', watchRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/fixed-expenses', fixedExpenseRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/money/overview', overviewRoutes);
app.use('/api/exams', examRouter);
app.use('/api/subjects', subjectRouter);
app.use('/api/topics', topicRouter);
app.use('/api/study-events', studyEventRoutes);

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
