import express from 'express';
import * as fundController from './fund.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', fundController.createFund);
router.get('/', fundController.getFunds);
router.get('/:id', fundController.getFundById);
router.patch('/:id', fundController.updateFund);
router.post('/:id/add', fundController.addToFund);
router.post('/:id/withdraw', fundController.withdrawFromFund);

export default router;
