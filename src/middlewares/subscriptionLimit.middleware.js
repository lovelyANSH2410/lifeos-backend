import { checkSubscriptionLimit } from '../utils/subscriptionLimit.util.js';
import { sendError, sendValidationError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../utils/logger.util.js';

/**
 * Middleware to check subscription limits before allowing creation
 * @param {string} featureName - Feature name (diary, ideas, travel, watch, gifting, subscriptions, vault, documents)
 * @returns {Function} Express middleware function
 */
export const checkSubscriptionLimitMiddleware = (featureName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
      }

      // Check subscription limit
      const limitCheck = await checkSubscriptionLimit(userId, featureName);

      if (!limitCheck.allowed) {
        logger.info(`Subscription limit exceeded for user ${userId}, feature: ${featureName}, count: ${limitCheck.currentCount}, limit: ${limitCheck.limit}`);
        
        // Return validation error with upgrade message
        return sendValidationError(res, [{
          field: 'subscription',
          message: limitCheck.message
        }]);
      }

      // Attach limit info to request for potential use in controller
      req.subscriptionLimit = {
        currentCount: limitCheck.currentCount,
        limit: limitCheck.limit,
        remaining: limitCheck.limit === -1 ? -1 : limitCheck.limit - limitCheck.currentCount
      };

      next();
    } catch (error) {
      logger.error(`Subscription limit middleware error for ${featureName}: ${error.message}`);
      return sendError(res, 'Failed to check subscription limit', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
};
