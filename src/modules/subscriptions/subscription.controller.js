import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as subscriptionService from './subscription.service.js';
import logger from '../../utils/logger.util.js';

/**
 * Create a new subscription
 */
export const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name,
      provider,
      icon,
      amount,
      currency,
      billingCycle,
      renewalDate,
      lastUsedAt,
      category,
      status,
      notes,
      isAutoRenew
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return sendValidationError(res, [{
        field: 'name',
        message: 'Subscription name is required'
      }]);
    }

    if (amount === undefined || amount === null) {
      return sendValidationError(res, [{
        field: 'amount',
        message: 'Amount is required'
      }]);
    }

    if (amount < 0) {
      return sendValidationError(res, [{
        field: 'amount',
        message: 'Amount must be greater than or equal to 0'
      }]);
    }

    if (!renewalDate) {
      return sendValidationError(res, [{
        field: 'renewalDate',
        message: 'Renewal date is required'
      }]);
    }

    // Validate enums
    const validBillingCycles = ['monthly', 'yearly'];
    if (billingCycle && !validBillingCycles.includes(billingCycle)) {
      return sendValidationError(res, [{
        field: 'billingCycle',
        message: `Billing cycle must be one of: ${validBillingCycles.join(', ')}`
      }]);
    }

    const validCategories = ['entertainment', 'productivity', 'cloud', 'utilities', 'education', 'other'];
    if (category && !validCategories.includes(category)) {
      return sendValidationError(res, [{
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      }]);
    }

    const validStatuses = ['active', 'paused', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return sendValidationError(res, [{
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }]);
    }

    // Validate notes length
    if (notes && notes.length > 500) {
      return sendValidationError(res, [{
        field: 'notes',
        message: 'Notes cannot exceed 500 characters'
      }]);
    }

    const subscriptionData = {
      name: name.trim(),
      provider: provider?.trim(),
      icon: icon?.trim(),
      amount: parseFloat(amount),
      currency: currency || 'USD',
      billingCycle: billingCycle || 'monthly',
      renewalDate: new Date(renewalDate),
      lastUsedAt: lastUsedAt ? new Date(lastUsedAt) : undefined,
      category: category || 'other',
      status: status || 'active',
      notes: notes?.trim(),
      isAutoRenew: isAutoRenew !== undefined ? isAutoRenew : true
    };

    const subscription = await subscriptionService.createSubscription(userId, subscriptionData);

    return sendSuccess(
      res,
      subscription,
      'Subscription created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create subscription controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get subscriptions for the logged-in user
 */
export const getSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      status,
      category,
      upcoming
    } = req.query;

    const filters = {
      status,
      category,
      upcoming
    };

    const subscriptions = await subscriptionService.getSubscriptions(userId, filters);

    return sendSuccess(res, subscriptions, 'Subscriptions retrieved successfully');
  } catch (error) {
    logger.error(`Get subscriptions controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get subscription summary
 */
export const getSubscriptionSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const summary = await subscriptionService.getSubscriptionSummary(userId);

    return sendSuccess(res, summary, 'Subscription summary retrieved successfully');
  } catch (error) {
    logger.error(`Get subscription summary controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single subscription by ID
 */
export const getSubscriptionById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const subscription = await subscriptionService.getSubscriptionById(id, userId);

    return sendSuccess(res, subscription, 'Subscription retrieved successfully');
  } catch (error) {
    logger.error(`Get subscription by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Update a subscription
 */
export const updateSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    // Validate amount if provided
    if (updateData.amount !== undefined) {
      if (updateData.amount < 0) {
        return sendValidationError(res, [{
          field: 'amount',
          message: 'Amount must be greater than or equal to 0'
        }]);
      }
      updateData.amount = parseFloat(updateData.amount);
    }

    // Validate enums if provided
    const validBillingCycles = ['monthly', 'yearly'];
    if (updateData.billingCycle && !validBillingCycles.includes(updateData.billingCycle)) {
      return sendValidationError(res, [{
        field: 'billingCycle',
        message: `Billing cycle must be one of: ${validBillingCycles.join(', ')}`
      }]);
    }

    const validCategories = ['entertainment', 'productivity', 'cloud', 'utilities', 'education', 'other'];
    if (updateData.category && !validCategories.includes(updateData.category)) {
      return sendValidationError(res, [{
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      }]);
    }

    const validStatuses = ['active', 'paused', 'cancelled'];
    if (updateData.status && !validStatuses.includes(updateData.status)) {
      return sendValidationError(res, [{
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }]);
    }

    // Validate notes length
    if (updateData.notes && updateData.notes.length > 500) {
      return sendValidationError(res, [{
        field: 'notes',
        message: 'Notes cannot exceed 500 characters'
      }]);
    }

    // Convert date strings to Date objects
    if (updateData.renewalDate) {
      updateData.renewalDate = new Date(updateData.renewalDate);
    }
    if (updateData.lastUsedAt) {
      updateData.lastUsedAt = new Date(updateData.lastUsedAt);
    }

    // Trim string fields
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.provider) updateData.provider = updateData.provider.trim();
    if (updateData.icon) updateData.icon = updateData.icon.trim();
    if (updateData.notes) updateData.notes = updateData.notes.trim();

    const subscription = await subscriptionService.updateSubscription(id, userId, updateData);

    return sendSuccess(res, subscription, 'Subscription updated successfully');
  } catch (error) {
    logger.error(`Update subscription controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Delete (cancel) a subscription
 */
export const deleteSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const subscription = await subscriptionService.cancelSubscription(id, userId);

    return sendSuccess(res, subscription, 'Subscription cancelled successfully');
  } catch (error) {
    logger.error(`Delete subscription controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
