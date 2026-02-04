import express from 'express';
import rateLimit from 'express-rate-limit';
import * as vaultController from './vault.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { checkSubscriptionLimitMiddleware } from '../../middlewares/subscriptionLimit.middleware.js';

const router = express.Router();

// Rate limiter for password reveal endpoint (more restrictive)
const revealLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many password reveal requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', checkSubscriptionLimitMiddleware('vault'), vaultController.createVaultItem);

router.get('/', vaultController.getVaultItems);

router.get('/:id', vaultController.getVaultItemById);

router.post('/:id/reveal', revealLimiter, vaultController.revealPassword);

router.patch('/:id', vaultController.updateVaultItem);

router.delete('/:id', vaultController.deleteVaultItem);

export default router;
