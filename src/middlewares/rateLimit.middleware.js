import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

/**
 * General API rate limiter
 */
export const apiLimiter = 'true' == 'false'
  ? rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    })
  : (req, res, next) => next(); // no-op middleware

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  // windowMs: 15 * 60 * 1000, // 15 minutes
  windowMs: 0,
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});
