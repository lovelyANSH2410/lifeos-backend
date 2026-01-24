import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as vaultService from './vault.service.js';
import logger from '../../utils/logger.util.js';

/**
 * Create a new vault item
 */
export const createVaultItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      username,
      password,
      category,
      notes
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return sendValidationError(res, [{
        field: 'title',
        message: 'Title is required'
      }]);
    }

    if (title.trim().length > 200) {
      return sendValidationError(res, [{
        field: 'title',
        message: 'Title cannot exceed 200 characters'
      }]);
    }

    if (!password || !password.trim()) {
      return sendValidationError(res, [{
        field: 'password',
        message: 'Password is required'
      }]);
    }

    // Validate category
    const validCategories = ['credentials', 'bank', 'utility', 'other'];
    if (category && !validCategories.includes(category)) {
      return sendValidationError(res, [{
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      }]);
    }

    // Validate notes length
    if (notes && notes.length > 1000) {
      return sendValidationError(res, [{
        field: 'notes',
        message: 'Notes cannot exceed 1000 characters'
      }]);
    }

    // Validate username length
    if (username && username.length > 500) {
      return sendValidationError(res, [{
        field: 'username',
        message: 'Username cannot exceed 500 characters'
      }]);
    }

    const itemData = {
      title: title.trim(),
      username: username?.trim(),
      password: password,
      category: category || 'credentials',
      notes: notes?.trim()
    };

    const vaultItem = await vaultService.createVaultItem(userId, itemData);

    return sendSuccess(
      res,
      vaultItem,
      'Vault item created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create vault item controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get vault items for the logged-in user
 */
export const getVaultItems = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;

    const filters = {
      category
    };

    const vaultItems = await vaultService.getVaultItems(userId, filters);

    return sendSuccess(res, vaultItems, 'Vault items retrieved successfully');
  } catch (error) {
    logger.error(`Get vault items controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single vault item by ID
 */
export const getVaultItemById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const vaultItem = await vaultService.getVaultItemById(id, userId);

    return sendSuccess(res, vaultItem, 'Vault item retrieved successfully');
  } catch (error) {
    logger.error(`Get vault item by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Reveal (decrypt) password for a vault item
 */
export const revealPassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await vaultService.revealPassword(id, userId);

    // Return only the password
    return sendSuccess(res, result, 'Password revealed successfully');
  } catch (error) {
    logger.error(`Reveal password controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    // Don't expose decryption errors in detail
    if (error.message.includes('decrypt') || error.message.includes('Failed to decrypt')) {
      return sendError(res, 'Failed to decrypt password', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    next(error);
  }
};

/**
 * Update a vault item
 */
export const updateVaultItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      title,
      username,
      password,
      category,
      notes
    } = req.body;

    // Validate title if provided
    if (title !== undefined) {
      if (!title || !title.trim()) {
        return sendValidationError(res, [{
          field: 'title',
          message: 'Title is required'
        }]);
      }
      if (title.trim().length > 200) {
        return sendValidationError(res, [{
          field: 'title',
          message: 'Title cannot exceed 200 characters'
        }]);
      }
    }

    // Validate category if provided
    const validCategories = ['credentials', 'bank', 'utility', 'other'];
    if (category && !validCategories.includes(category)) {
      return sendValidationError(res, [{
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      }]);
    }

    // Validate notes length if provided
    if (notes !== undefined && notes.length > 1000) {
      return sendValidationError(res, [{
        field: 'notes',
        message: 'Notes cannot exceed 1000 characters'
      }]);
    }

    // Validate username length if provided
    if (username !== undefined && username.length > 500) {
      return sendValidationError(res, [{
        field: 'username',
        message: 'Username cannot exceed 500 characters'
      }]);
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (username !== undefined) updateData.username = username?.trim();
    if (password !== undefined) updateData.password = password;
    if (category !== undefined) updateData.category = category;
    if (notes !== undefined) updateData.notes = notes?.trim();

    const vaultItem = await vaultService.updateVaultItem(id, userId, updateData);

    return sendSuccess(res, vaultItem, 'Vault item updated successfully');
  } catch (error) {
    logger.error(`Update vault item controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Delete a vault item
 */
export const deleteVaultItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await vaultService.deleteVaultItem(id, userId);

    return sendSuccess(res, null, 'Vault item deleted successfully');
  } catch (error) {
    logger.error(`Delete vault item controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
