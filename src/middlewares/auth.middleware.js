import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { sendError } from '../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', HTTP_STATUS.UNAUTHORIZED);
    }
    return sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't fail if missing
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};
