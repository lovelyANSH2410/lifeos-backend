import express from 'express';
import * as fixedExpenseController from './fixedExpense.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', fixedExpenseController.createFixedExpense);
router.get('/', fixedExpenseController.getFixedExpenses);
router.patch('/:id', fixedExpenseController.updateFixedExpense);
router.delete('/:id', fixedExpenseController.deleteFixedExpense);

export default router;
