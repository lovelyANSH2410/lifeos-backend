import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as subscriptionService from './subscription.service.js';
import logger from '../../utils/logger.util.js';

/**
 * Get current user subscription
 */
export const getSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user.id);
    return sendSuccess(res, subscription, 'Subscription retrieved successfully');
  } catch (error) {
    logger.error(`Get subscription controller error: ${error.message}`);
    
    if (error.message === MESSAGES.USER_NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Upgrade subscription
 */
export const upgradeSubscription = async (req, res, next) => {
  try {
    const { plan, billingCycle } = req.body;

    // Validation
    if (!plan) {
      return sendValidationError(res, [{
        field: 'plan',
        message: 'Plan is required'
      }]);
    }

    const validPlans = ['PRO', 'COUPLE', 'LIFETIME'];
    if (!validPlans.includes(plan)) {
      return sendValidationError(res, [{
        field: 'plan',
        message: `Plan must be one of: ${validPlans.join(', ')}`
      }]);
    }

    // Billing cycle validation
    if (plan !== 'LIFETIME' && !billingCycle) {
      return sendValidationError(res, [{
        field: 'billingCycle',
        message: 'Billing cycle is required for this plan'
      }]);
    }

    if (plan !== 'LIFETIME') {
      const validCycles = ['MONTHLY', 'YEARLY'];
      if (!validCycles.includes(billingCycle)) {
        return sendValidationError(res, [{
          field: 'billingCycle',
          message: `Billing cycle must be one of: ${validCycles.join(', ')}`
        }]);
      }
    }

    const subscription = await subscriptionService.upgradeSubscription(
      req.user.id,
      plan,
      billingCycle || 'NONE'
    );

    return sendSuccess(res, subscription, 'Subscription upgraded successfully');
  } catch (error) {
    logger.error(`Upgrade subscription controller error: ${error.message}`);
    
    if (error.message === MESSAGES.USER_NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    if (error.message.includes('Invalid')) {
      return sendValidationError(res, [{
        field: 'subscription',
        message: error.message
      }]);
    }

    next(error);
  }
};

/**
 * Cancel subscription (downgrade to FREE)
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.cancelSubscription(req.user.id);
    return sendSuccess(res, subscription, 'Subscription cancelled successfully');
  } catch (error) {
    logger.error(`Cancel subscription controller error: ${error.message}`);
    
    if (error.message === MESSAGES.USER_NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
