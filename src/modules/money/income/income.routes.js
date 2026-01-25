import express from 'express';
import * as incomeController from './income.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', incomeController.createIncome);
router.get('/', incomeController.getIncomes);
router.get('/monthly-summary', incomeController.getMonthlySummary);
router.delete('/:id', incomeController.deleteIncome);

export default router;
