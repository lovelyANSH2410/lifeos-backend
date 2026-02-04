import Razorpay from 'razorpay';
import crypto from 'crypto';
import env from '../../config/env.js';
import logger from '../../utils/logger.util.js';

// Validate Razorpay credentials
if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
  logger.warn('Razorpay credentials are missing. Payment functionality will not work.');
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay order for subscription payment
 * @param {string} userId - User ID
 * @param {string} plan - Subscription plan (PRO, COUPLE, LIFETIME)
 * @param {string} billingCycle - Billing cycle (MONTHLY, YEARLY, NONE)
 * @param {number} amount - Amount in INR
 * @returns {Promise<Object>} Razorpay order object
 */
export const createOrder = async (userId, plan, billingCycle, amount) => {
  try {
    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create receipt ID (max 40 characters for Razorpay)
    // Format: sub_<userId_last12chars>_<timestamp_last8chars>
    const userIdStr = userId.toString();
    const userIdShort = userIdStr.slice(-12); // Last 12 characters of userId
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const receipt = `sub_${userIdShort}_${timestamp}`;

    // Create order options
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      notes: {
        userId: userId.toString(),
        plan: plan,
        billingCycle: billingCycle
      }
    };

    // Create order with Razorpay
    const order = await razorpay.orders.create(options);

    logger.info(`Razorpay order created: ${order.id} for user ${userId}, plan: ${plan}, amount: ${amount} INR`);

    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      key: env.RAZORPAY_KEY_ID // Return key for frontend
    };
  } catch (error) {
    const errorMessage = error?.message || error?.error?.description || error?.error?.reason || JSON.stringify(error) || 'Unknown error';
    logger.error(`Create Razorpay order error: ${errorMessage}`, error);
    
    // Check if it's a credential issue
    if (errorMessage.includes('key_id') || errorMessage.includes('key_secret') || !env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials are not configured. Please check your environment variables.');
    }
    
    throw new Error(`Failed to create payment order: ${errorMessage}`);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} True if signature is valid
 */
export const verifyPayment = (orderId, paymentId, signature) => {
  try {
    // Validate inputs
    if (!orderId || !paymentId || !signature) {
      logger.warn('Payment verification: Missing required parameters');
      return false;
    }

    if (!env.RAZORPAY_KEY_SECRET) {
      logger.error('Payment verification: RAZORPAY_KEY_SECRET is not configured');
      return false;
    }

    // Create signature string: razorpay_order_id + "|" + razorpay_payment_id
    // According to Razorpay docs, the order is: order_id|payment_id (order first!)
    const text = `${orderId}|${paymentId}`;

    // Generate expected signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Trim and normalize signatures (remove any whitespace)
    const receivedSignature = signature.trim();
    const expectedSig = expectedSignature.trim();

    // Log for debugging (remove in production or use debug level)
    logger.info(`Verifying payment: orderId=${orderId}, paymentId=${paymentId}`);
    logger.info(`Expected signature length: ${expectedSig.length}, Received signature length: ${receivedSignature.length}`);

    // Compare signatures (use timing-safe comparison)
    // timingSafeEqual requires both buffers to be the same length
    const signatureBuffer = Buffer.from(receivedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      logger.warn(`Payment signature length mismatch: expected=${expectedBuffer.length}, received=${signatureBuffer.length}`);
      logger.warn(`Expected: ${expectedSig.substring(0, 20)}..., Received: ${receivedSignature.substring(0, 20)}...`);
      return false;
    }

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (isValid) {
      logger.info(`Payment verified successfully: orderId=${orderId}, paymentId=${paymentId}`);
    } else {
      logger.warn(`Payment verification failed: orderId=${orderId}, paymentId=${paymentId}`);
      logger.warn(`Expected: ${expectedSig.substring(0, 20)}..., Received: ${receivedSignature.substring(0, 20)}...`);
    }

    return isValid;
  } catch (error) {
    const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
    logger.error(`Payment verification error: ${errorMessage}`, error);
    return false;
  }
};

/**
 * Get payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    const errorMessage = error?.message || error?.error?.description || error?.error?.reason || JSON.stringify(error) || 'Unknown error';
    logger.error(`Get payment details error: ${errorMessage}`, error);
    throw new Error(`Failed to fetch payment details: ${errorMessage}`);
  }
};
