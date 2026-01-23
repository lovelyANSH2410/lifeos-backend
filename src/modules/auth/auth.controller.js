import { validationResult } from 'express-validator';
import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as authService from './auth.service.js';
import logger from '../../utils/logger.util.js';

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const { name, email, password } = req.body;

    const result = await authService.registerUser({
      name,
      email,
      password
    });

    return sendSuccess(
      res,
      result,
      'User registered successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Register controller error: ${error.message}`);
    
    if (error.message === MESSAGES.USER_EXISTS) {
      return sendError(res, error.message, HTTP_STATUS.CONFLICT);
    }

    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    return sendSuccess(res, result, 'Login successful');
  } catch (error) {
    logger.error(`Login controller error: ${error.message}`);
    
    if (error.message === MESSAGES.INVALID_CREDENTIALS || error.message === 'Account is deactivated') {
      return sendError(res, error.message, HTTP_STATUS.UNAUTHORIZED);
    }

    next(error);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    return sendSuccess(res, user, 'Profile retrieved successfully');
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
};
