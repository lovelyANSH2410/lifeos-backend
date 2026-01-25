import express from 'express';
import * as transactionController from './transaction.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/monthly', transactionController.getMonthlyTransactions);

export default router;
