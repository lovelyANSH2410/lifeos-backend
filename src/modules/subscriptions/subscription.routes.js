import express from 'express';
import * as subscriptionController from './subscription.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { checkSubscriptionLimitMiddleware } from '../../middlewares/subscriptionLimit.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', checkSubscriptionLimitMiddleware('subscriptions'), subscriptionController.createSubscription);
router.get('/', subscriptionController.getSubscriptions);
router.get('/summary', subscriptionController.getSubscriptionSummary);
router.get('/:id', subscriptionController.getSubscriptionById);
router.patch('/:id', subscriptionController.updateSubscription);
router.delete('/:id', subscriptionController.deleteSubscription);

export default router;
