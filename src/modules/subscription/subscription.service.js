import User from '../auth/auth.schema.js';
import { MESSAGES } from '../../config/constants.js';
import logger from '../../utils/logger.util.js';

// Pricing configuration (INR)
const PRICING = {
  PRO: {
    MONTHLY: 199,
    YEARLY: 1499
  },
  COUPLE: {
    MONTHLY: 299,
    YEARLY: 2499
  },
  LIFETIME: {
    NONE: 4999
  }
};

/**
 * Get user subscription
 */
export const getUserSubscription = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(MESSAGES.USER_NOT_FOUND);
    }

    const subscription = user.subscription || {
      plan: 'FREE',
      billingCycle: 'NONE',
      price: 0,
      startedAt: null,
      expiresAt: null,
      isActive: true
    };

    // Calculate days remaining
    let daysRemaining = null;
    if (subscription.expiresAt) {
      const now = new Date();
      const diff = subscription.expiresAt - now;
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    // Check if subscription is actually active
    const isActive = user.isSubscriptionActive();

    return {
      plan: subscription.plan,
      billingCycle: subscription.billingCycle,
      price: subscription.price,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      isActive,
      daysRemaining
    };
  } catch (error) {
    logger.error(`Get user subscription error: ${error.message}`);
    throw error;
  }
};

/**
 * Calculate subscription price
 */
const calculatePrice = (plan, billingCycle) => {
  if (plan === 'FREE') return 0;
  if (plan === 'LIFETIME') return PRICING.LIFETIME.NONE;
  if (plan === 'PRO') {
    return billingCycle === 'MONTHLY' ? PRICING.PRO.MONTHLY : PRICING.PRO.YEARLY;
  }
  if (plan === 'COUPLE') {
    return billingCycle === 'MONTHLY' ? PRICING.COUPLE.MONTHLY : PRICING.COUPLE.YEARLY;
  }
  return 0;
};

/**
 * Calculate expiry date
 */
const calculateExpiryDate = (plan, billingCycle) => {
  if (plan === 'FREE' || plan === 'LIFETIME') {
    return null; // No expiry
  }

  const now = new Date();
  if (billingCycle === 'MONTHLY') {
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 30);
    return expiry;
  }
  if (billingCycle === 'YEARLY') {
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  }
  return null;
};

/**
 * Upgrade user subscription
 */
export const upgradeSubscription = async (userId, plan, billingCycle) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(MESSAGES.USER_NOT_FOUND);
    }

    // Validate plan
    const validPlans = ['PRO', 'COUPLE', 'LIFETIME'];
    if (!validPlans.includes(plan)) {
      throw new Error('Invalid subscription plan');
    }

    // Validate billing cycle
    if (plan === 'LIFETIME') {
      billingCycle = 'NONE';
    } else {
      const validCycles = ['MONTHLY', 'YEARLY'];
      if (!validCycles.includes(billingCycle)) {
        throw new Error('Invalid billing cycle');
      }
    }

    // Calculate price and expiry
    const price = calculatePrice(plan, billingCycle);
    const startedAt = new Date();
    const expiresAt = calculateExpiryDate(plan, billingCycle);

    // Update user subscription
    user.subscription = {
      plan,
      billingCycle,
      price,
      startedAt,
      expiresAt,
      isActive: true
    };

    await user.save();

    // Return updated subscription
    return getUserSubscription(userId);
  } catch (error) {
    logger.error(`Upgrade subscription error: ${error.message}`);
    throw error;
  }
};

/**
 * Cancel user subscription (downgrade to FREE)
 */
export const cancelSubscription = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(MESSAGES.USER_NOT_FOUND);
    }

    // Downgrade to FREE
    user.subscription = {
      plan: 'FREE',
      billingCycle: 'NONE',
      price: 0,
      startedAt: null,
      expiresAt: null,
      isActive: true
    };

    await user.save();

    // Return updated subscription
    return getUserSubscription(userId);
  } catch (error) {
    logger.error(`Cancel subscription error: ${error.message}`);
    throw error;
  }
};
