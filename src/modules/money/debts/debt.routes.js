import express from 'express';
import * as debtController from './debt.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', debtController.createDebt);
router.get('/', debtController.getDebts);
router.get('/:id', debtController.getDebtById);
router.patch('/:id/settle', debtController.settleDebt);
router.delete('/:id', debtController.deleteDebt);

export default router;
