import WishlistItem from './wishlist.model.js';
import logger from '../../../utils/logger.util.js';
import { MESSAGES } from '../../../config/constants.js';

/**
 * Create a new wishlist item
 */
export const createWishlistItem = async (userId, itemData) => {
  try {
    const wishlistItem = await WishlistItem.create({
      userId,
      name: itemData.name.trim(),
      price: itemData.price,
      priority: itemData.priority || 'medium',
      status: itemData.status || 'pending',
      plannedMonth: itemData.plannedMonth?.trim()
    });

    return wishlistItem;
  } catch (error) {
    logger.error(`Create wishlist item error: ${error.message}`);
    throw error;
  }
};

/**
 * Get wishlist items for a user
 */
export const getWishlistItems = async (userId, filters = {}) => {
  try {
    const { status, priority, plannedMonth } = filters;

    const query = { userId };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (plannedMonth) {
      query.plannedMonth = plannedMonth;
    }

    const wishlistItems = await WishlistItem.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return wishlistItems;
  } catch (error) {
    logger.error(`Get wishlist items error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single wishlist item by ID
 */
export const getWishlistItemById = async (itemId, userId) => {
  try {
    const wishlistItem = await WishlistItem.findOne({
      _id: itemId,
      userId
    }).lean();

    if (!wishlistItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return wishlistItem;
  } catch (error) {
    logger.error(`Get wishlist item by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Update a wishlist item
 */
export const updateWishlistItem = async (itemId, userId, updateData) => {
  try {
    const wishlistItem = await WishlistItem.findOne({
      _id: itemId,
      userId
    });

    if (!wishlistItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    const updateFields = {};

    if (updateData.name !== undefined) {
      updateFields.name = updateData.name.trim();
    }
    if (updateData.price !== undefined) {
      updateFields.price = updateData.price;
    }
    if (updateData.priority !== undefined) {
      updateFields.priority = updateData.priority;
    }
    if (updateData.status !== undefined) {
      updateFields.status = updateData.status;
    }
    if (updateData.plannedMonth !== undefined) {
      updateFields.plannedMonth = updateData.plannedMonth?.trim() || null;
    }

    const updatedItem = await WishlistItem.findByIdAndUpdate(
      itemId,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    return updatedItem;
  } catch (error) {
    logger.error(`Update wishlist item error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a wishlist item
 */
export const deleteWishlistItem = async (itemId, userId) => {
  try {
    const wishlistItem = await WishlistItem.findOneAndDelete({
      _id: itemId,
      userId
    });

    if (!wishlistItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return wishlistItem;
  } catch (error) {
    logger.error(`Delete wishlist item error: ${error.message}`);
    throw error;
  }
};
