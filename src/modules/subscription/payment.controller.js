import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as paymentService from './payment.service.js';
import * as subscriptionService from './subscription.service.js';
import logger from '../../utils/logger.util.js';

// Pricing configuration (INR) - same as subscription.service.js
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
 * Create payment order for subscription upgrade
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { plan, billingCycle } = req.body;
    const userId = req.user.id;

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
    let finalBillingCycle = billingCycle;
    if (plan !== 'LIFETIME') {
      if (!billingCycle) {
        return sendValidationError(res, [{
          field: 'billingCycle',
          message: 'Billing cycle is required for this plan'
        }]);
      }

      const validCycles = ['MONTHLY', 'YEARLY'];
      if (!validCycles.includes(billingCycle)) {
        return sendValidationError(res, [{
          field: 'billingCycle',
          message: `Billing cycle must be one of: ${validCycles.join(', ')}`
        }]);
      }
    } else {
      finalBillingCycle = 'NONE';
    }

    // Calculate amount
    const amount = calculatePrice(plan, finalBillingCycle);

    if (amount <= 0) {
      return sendValidationError(res, [{
        field: 'plan',
        message: 'Invalid plan or billing cycle combination'
      }]);
    }

    // Create Razorpay order
    const order = await paymentService.createOrder(
      userId,
      plan,
      finalBillingCycle,
      amount
    );

    return sendSuccess(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: order.key
    }, 'Payment order created successfully');
  } catch (error) {
    const errorMessage = error?.message || error?.error?.message || 'An error occurred while creating payment order';
    logger.error(`Create payment order controller error: ${errorMessage}`, error);
    
    if (errorMessage === MESSAGES.USER_NOT_FOUND) {
      return sendError(res, errorMessage, HTTP_STATUS.NOT_FOUND);
    }

    if (errorMessage.includes('Failed to create payment order') || errorMessage.includes('Razorpay')) {
      return sendError(res, errorMessage, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    next(error);
  }
};

/**
 * Verify payment and update subscription
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, plan, billingCycle } = req.body;
    const userId = req.user.id;

    // Validation
    if (!orderId || !paymentId || !signature) {
      return sendValidationError(res, [{
        field: 'payment',
        message: 'Order ID, Payment ID, and Signature are required'
      }]);
    }

    if (!plan) {
      return sendValidationError(res, [{
        field: 'plan',
        message: 'Plan is required'
      }]);
    }

    // Validate plan
    const validPlans = ['PRO', 'COUPLE', 'LIFETIME'];
    if (!validPlans.includes(plan)) {
      return sendValidationError(res, [{
        field: 'plan',
        message: `Plan must be one of: ${validPlans.join(', ')}`
      }]);
    }

    // Billing cycle validation
    let finalBillingCycle = billingCycle;
    if (plan !== 'LIFETIME') {
      if (!billingCycle) {
        return sendValidationError(res, [{
          field: 'billingCycle',
          message: 'Billing cycle is required for this plan'
        }]);
      }

      const validCycles = ['MONTHLY', 'YEARLY'];
      if (!validCycles.includes(billingCycle)) {
        return sendValidationError(res, [{
          field: 'billingCycle',
          message: `Billing cycle must be one of: ${validCycles.join(', ')}`
        }]);
      }
    } else {
      finalBillingCycle = 'NONE';
    }

    // Verify payment signature
    const isVerified = paymentService.verifyPayment(orderId, paymentId, signature);

    if (!isVerified) {
      return sendError(res, 'Payment verification failed. Invalid signature.', HTTP_STATUS.BAD_REQUEST);
    }

    // Verify payment status with Razorpay (optional but recommended)
    try {
      const paymentDetails = await paymentService.getPaymentDetails(paymentId);
      
      if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
        return sendError(res, `Payment not successful. Status: ${paymentDetails.status}`, HTTP_STATUS.BAD_REQUEST);
      }

      if (paymentDetails.order_id !== orderId) {
        return sendError(res, 'Payment order ID mismatch', HTTP_STATUS.BAD_REQUEST);
      }
    } catch (error) {
      logger.error(`Payment details verification error: ${error.message}`);
      return sendError(res, 'Failed to verify payment details', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Update subscription after successful payment verification
    const subscription = await subscriptionService.upgradeSubscription(
      userId,
      plan,
      finalBillingCycle
    );

    return sendSuccess(res, {
      subscription,
      paymentId,
      orderId
    }, 'Payment verified and subscription upgraded successfully');
  } catch (error) {
    const errorMessage = error?.message || error?.error?.message || 'An error occurred while verifying payment';
    logger.error(`Verify payment controller error: ${errorMessage}`, error);
    
    if (errorMessage === MESSAGES.USER_NOT_FOUND) {
      return sendError(res, errorMessage, HTTP_STATUS.NOT_FOUND);
    }

    if (errorMessage.includes('Invalid')) {
      return sendValidationError(res, [{
        field: 'subscription',
        message: errorMessage
      }]);
    }

    next(error);
  }
};
