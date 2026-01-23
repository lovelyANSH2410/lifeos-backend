import jwt from 'jsonwebtoken';
import User from './auth.schema.js';
import env from '../../config/env.js';
import { MESSAGES } from '../../config/constants.js';
import logger from '../../utils/logger.util.js';

/**
 * Register a new user
 */
export const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error(MESSAGES.USER_EXISTS);
    }

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    // Remove password from user object
    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      token
    };
  } catch (error) {
    logger.error(`Register user error: ${error.message}`);
    throw error;
  }
};

/**
 * Login user
 */
export const loginUser = async (email, password) => {
  try {
    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error(MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error(MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user._id);

    // Remove password from user object
    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      token
    };
  } catch (error) {
    logger.error(`Login user error: ${error.message}`);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(MESSAGES.USER_NOT_FOUND);
    }
    return user;
  } catch (error) {
    logger.error(`Get user by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRE }
  );
};
