import Subscription from './subscription.model.js';
import logger from '../../utils/logger.util.js';
import { MESSAGES } from '../../config/constants.js';

/**
 * Calculate normalized monthly cost
 */
const calculateMonthlyCost = (amount, billingCycle) => {
  if (billingCycle === 'yearly') {
    return amount / 12;
  }
  return amount; // monthly
};

/**
 * Generate optimization tips
 */
const generateOptimizationTips = (subscriptions) => {
  const tips = [];

  subscriptions.forEach(sub => {
    // Check if subscription hasn't been used in 25+ days
    if (sub.lastUsedAt) {
      const daysSinceLastUse = Math.floor(
        (new Date() - new Date(sub.lastUsedAt)) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastUse > 25 && sub.status === 'active') {
        tips.push({
          subscriptionId: sub._id,
          subscriptionName: sub.name,
          suggestion: 'Consider pausing this subscription - last used more than 25 days ago',
          potentialSavings: calculateMonthlyCost(sub.amount, sub.billingCycle)
        });
      }
    }
  });

  return tips;
};

/**
 * Create a new subscription
 */
export const createSubscription = async (userId, subscriptionData) => {
  try {
    const subscription = await Subscription.create({
      userId,
      ...subscriptionData
    });

    return subscription;
  } catch (error) {
    logger.error(`Create subscription error: ${error.message}`);
    throw error;
  }
};

/**
 * Get subscriptions for a user with filters
 */
export const getSubscriptions = async (userId, filters = {}) => {
  try {
    const {
      status,
      category,
      upcoming
    } = filters;

    // Build query
    const query = {
      userId
    };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter upcoming renewals (next 7 days)
    if (upcoming === 'true' || upcoming === true) {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      query.renewalDate = {
        $gte: today,
        $lte: nextWeek
      };
      query.status = 'active'; // Only show active subscriptions for upcoming
    }

    // Fetch subscriptions sorted by renewal date
    const subscriptions = await Subscription.find(query)
      .sort({ renewalDate: 1 })
      .lean();

    return subscriptions;
  } catch (error) {
    logger.error(`Get subscriptions error: ${error.message}`);
    throw error;
  }
};

/**
 * Get subscription summary
 */
export const getSubscriptionSummary = async (userId) => {
  try {
    // Get all active subscriptions
    const activeSubscriptions = await Subscription.find({
      userId,
      status: 'active'
    }).lean();

    // Calculate monthly total
    let monthlyTotal = 0;
    activeSubscriptions.forEach(sub => {
      monthlyTotal += calculateMonthlyCost(sub.amount, sub.billingCycle);
    });

    // Get upcoming renewals (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingRenewals = activeSubscriptions.filter(sub => {
      const renewalDate = new Date(sub.renewalDate);
      return renewalDate >= today && renewalDate <= nextWeek;
    }).map(sub => ({
      _id: sub._id,
      name: sub.name,
      amount: sub.amount,
      currency: sub.currency,
      renewalDate: sub.renewalDate,
      billingCycle: sub.billingCycle
    }));

    // Generate optimization tips
    const optimizationTips = generateOptimizationTips(activeSubscriptions);

    return {
      monthlyTotal: Math.round(monthlyTotal * 100) / 100, // Round to 2 decimal places
      activeSubscriptionsCount: activeSubscriptions.length,
      upcomingRenewals,
      optimizationTips
    };
  } catch (error) {
    logger.error(`Get subscription summary error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single subscription by ID
 */
export const getSubscriptionById = async (subscriptionId, userId) => {
  try {
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId
    });

    if (!subscription) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return subscription;
  } catch (error) {
    logger.error(`Get subscription by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Update a subscription
 */
export const updateSubscription = async (subscriptionId, userId, updateData) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      {
        _id: subscriptionId,
        userId
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!subscription) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return subscription;
  } catch (error) {
    logger.error(`Update subscription error: ${error.message}`);
    throw error;
  }
};

/**
 * Soft delete (cancel) a subscription
 */
export const cancelSubscription = async (subscriptionId, userId) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      {
        _id: subscriptionId,
        userId
      },
      {
        status: 'cancelled'
      },
      {
        new: true
      }
    );

    if (!subscription) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return subscription;
  } catch (error) {
    logger.error(`Cancel subscription error: ${error.message}`);
    throw error;
  }
};
