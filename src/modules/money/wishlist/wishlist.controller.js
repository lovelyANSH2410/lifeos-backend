import { sendSuccess, sendError, sendValidationError } from '../../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../../config/constants.js';
import * as wishlistService from './wishlist.service.js';
import logger from '../../../utils/logger.util.js';

/**
 * Create a new wishlist item
 */
export const createWishlistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, price, priority, status, plannedMonth } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return sendValidationError(res, [{
        field: 'name',
        message: 'Name is required'
      }]);
    }

    if (price === undefined || price === null) {
      return sendValidationError(res, [{
        field: 'price',
        message: 'Price is required'
      }]);
    }

    if (price < 0) {
      return sendValidationError(res, [{
        field: 'price',
        message: 'Price must be greater than or equal to 0'
      }]);
    }

    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return sendValidationError(res, [{
          field: 'priority',
          message: `Priority must be one of: ${validPriorities.join(', ')}`
        }]);
      }
    }

    if (status !== undefined) {
      const validStatuses = ['pending', 'bought', 'removed'];
      if (!validStatuses.includes(status)) {
        return sendValidationError(res, [{
          field: 'status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        }]);
      }
    }

    if (plannedMonth !== undefined && plannedMonth !== null && plannedMonth !== '') {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(plannedMonth)) {
        return sendValidationError(res, [{
          field: 'plannedMonth',
          message: 'Planned month must be in YYYY-MM format'
        }]);
      }
    }

    const itemData = {
      name: name.trim(),
      price: parseFloat(price),
      priority: priority || 'medium',
      status: status || 'pending',
      plannedMonth: plannedMonth?.trim()
    };

    const wishlistItem = await wishlistService.createWishlistItem(userId, itemData);

    return sendSuccess(
      res,
      wishlistItem,
      'Wishlist item created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create wishlist item controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get wishlist items for the logged-in user
 */
export const getWishlistItems = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, priority, plannedMonth } = req.query;

    const filters = {
      status,
      priority,
      plannedMonth
    };

    const wishlistItems = await wishlistService.getWishlistItems(userId, filters);

    return sendSuccess(res, wishlistItems, 'Wishlist items retrieved successfully');
  } catch (error) {
    logger.error(`Get wishlist items controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single wishlist item by ID
 */
export const getWishlistItemById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const wishlistItem = await wishlistService.getWishlistItemById(id, userId);

    return sendSuccess(res, wishlistItem, 'Wishlist item retrieved successfully');
  } catch (error) {
    logger.error(`Get wishlist item by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Update a wishlist item
 */
export const updateWishlistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, price, priority, status, plannedMonth } = req.body;

    // Validate price if provided
    if (price !== undefined && price !== null && price < 0) {
      return sendValidationError(res, [{
        field: 'price',
        message: 'Price must be greater than or equal to 0'
      }]);
    }

    // Validate priority if provided
    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return sendValidationError(res, [{
          field: 'priority',
          message: `Priority must be one of: ${validPriorities.join(', ')}`
        }]);
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['pending', 'bought', 'removed'];
      if (!validStatuses.includes(status)) {
        return sendValidationError(res, [{
          field: 'status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        }]);
      }
    }

    // Validate plannedMonth if provided
    if (plannedMonth !== undefined && plannedMonth !== null && plannedMonth !== '') {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(plannedMonth)) {
        return sendValidationError(res, [{
          field: 'plannedMonth',
          message: 'Planned month must be in YYYY-MM format'
        }]);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (plannedMonth !== undefined) updateData.plannedMonth = plannedMonth?.trim() || null;

    const wishlistItem = await wishlistService.updateWishlistItem(id, userId, updateData);

    return sendSuccess(res, wishlistItem, 'Wishlist item updated successfully');
  } catch (error) {
    logger.error(`Update wishlist item controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Delete a wishlist item
 */
export const deleteWishlistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const wishlistItem = await wishlistService.deleteWishlistItem(id, userId);

    return sendSuccess(res, wishlistItem, 'Wishlist item deleted successfully');
  } catch (error) {
    logger.error(`Delete wishlist item controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
