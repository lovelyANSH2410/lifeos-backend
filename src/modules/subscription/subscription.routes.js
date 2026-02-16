import express from 'express';
import * as subscriptionController from './subscription.controller.js';
import * as paymentController from './payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Subscription routes
router.get('/', subscriptionController.getSubscription);
router.post('/upgrade', subscriptionController.upgradeSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);

// Payment routes
router.post('/payment/create', paymentController.createPaymentOrder);
router.post('/payment/verify', paymentController.verifyPayment);

export default router;
