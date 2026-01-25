import express from 'express';
import * as subscriptionController from './subscription.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', subscriptionController.getSubscription);
router.post('/upgrade', subscriptionController.upgradeSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);

export default router;
