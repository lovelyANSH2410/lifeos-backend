import WatchItem from './watch.model.js';
import { uploadImage, deleteImage } from '../../utils/cloudinary.util.js';
import logger from '../../utils/logger.util.js';
import { MESSAGES } from '../../config/constants.js';

/**
 * Create a new watch item
 */
export const createWatchItem = async (userId, itemData, posterFile = null) => {
  try {
    // Handle poster: either upload file to Cloudinary OR store URL directly
    let poster = null;
    if (posterFile) {
      // Upload file to Cloudinary
      try {
        const posterData = await uploadImage(posterFile, 'lifeos/watch');
        poster = posterData;
      } catch (error) {
        logger.error(`Failed to upload poster: ${error.message}`);
        // Continue without poster if upload fails
      }
    } else if (itemData.posterUrl) {
      // Store URL directly in database (no Cloudinary upload)
      poster = itemData.posterUrl;
    }

    // Validate rating if provided
    if (itemData.rating !== undefined && itemData.rating !== null) {
      if (itemData.status !== 'watched') {
        throw new Error('Rating can only be set when status is "watched"');
      }
    }

    // Validate progress fields if provided
    if (itemData.type !== 'series') {
      if (itemData.currentSeason !== undefined || itemData.currentEpisode !== undefined) {
        throw new Error('Progress tracking is only available for series');
      }
    }

    // Create watch item
    const watchItem = await WatchItem.create({
      userId,
      title: itemData.title.trim(),
      description: itemData.description?.trim(),
      type: itemData.type,
      status: itemData.status || 'planned',
      platforms: itemData.platforms || [],
      isFavorite: itemData.isFavorite || false,
      rating: itemData.rating,
      moodTags: itemData.moodTags || [],
      notes: itemData.notes?.trim(),
      poster,
      currentSeason: itemData.currentSeason,
      currentEpisode: itemData.currentEpisode,
      lastWatchedAt: itemData.lastWatchedAt
    });

    return watchItem;
  } catch (error) {
    logger.error(`Create watch item error: ${error.message}`);
    throw error;
  }
};

/**
 * Get watch items for a user with filters
 */
export const getWatchItems = async (userId, filters = {}) => {
  try {
    const {
      status,
      type,
      platform,
      isFavorite,
      rating
    } = filters;

    // Build query
    const query = {
      userId
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (platform) {
      query.platforms = { $in: [platform] };
    }

    if (isFavorite !== undefined) {
      query.isFavorite = isFavorite === 'true' || isFavorite === true;
    }

    if (rating !== undefined) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Determine sort order
    let sort = {};
    if (status === 'watching') {
      sort = { lastWatchedAt: -1, createdAt: -1 };
    } else {
      sort = { createdAt: -1 };
    }

    // Fetch watch items
    const watchItems = await WatchItem.find(query)
      .sort(sort)
      .lean();

    return watchItems;
  } catch (error) {
    logger.error(`Get watch items error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single watch item by ID
 */
export const getWatchItemById = async (itemId, userId) => {
  try {
    const watchItem = await WatchItem.findOne({
      _id: itemId,
      userId
    }).lean();

    if (!watchItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return watchItem;
  } catch (error) {
    logger.error(`Get watch item by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Update a watch item
 */
export const updateWatchItem = async (itemId, userId, updateData) => {
  try {
    const watchItem = await WatchItem.findOne({
      _id: itemId,
      userId
    });

    if (!watchItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Prepare update object
    const updateFields = {};

    if (updateData.status !== undefined) {
      updateFields.status = updateData.status;
      
      // If status is changed to watched and rating is provided, allow it
      // If status is changed away from watched, clear rating
      if (updateData.status === 'watched') {
        if (updateData.rating !== undefined) {
          updateFields.rating = updateData.rating;
        }
      } else {
        // Clear rating if status is not watched
        updateFields.rating = null;
      }
    } else if (updateData.rating !== undefined) {
      // If only rating is being updated, validate status
      if (watchItem.status !== 'watched') {
        throw new Error('Rating can only be set when status is "watched"');
      }
      updateFields.rating = updateData.rating;
    }

    if (updateData.notes !== undefined) {
      updateFields.notes = updateData.notes?.trim() || null;
    }

    if (updateData.moodTags !== undefined) {
      updateFields.moodTags = updateData.moodTags;
    }

    if (updateData.platforms !== undefined) {
      updateFields.platforms = updateData.platforms;
    }

    if (updateData.isFavorite !== undefined) {
      updateFields.isFavorite = updateData.isFavorite;
    }

    // Update watch item
    const updatedItem = await WatchItem.findByIdAndUpdate(
      itemId,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    return updatedItem;
  } catch (error) {
    logger.error(`Update watch item error: ${error.message}`);
    throw error;
  }
};

/**
 * Update series progress
 */
export const updateWatchProgress = async (itemId, userId, progressData) => {
  try {
    const watchItem = await WatchItem.findOne({
      _id: itemId,
      userId
    });

    if (!watchItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Validate that item is a series
    if (watchItem.type !== 'series') {
      throw new Error('Progress tracking is only available for series');
    }

    // Prepare update object
    const updateFields = {
      lastWatchedAt: new Date()
    };

    if (progressData.currentSeason !== undefined) {
      if (progressData.currentSeason < 1) {
        throw new Error('Season must be at least 1');
      }
      updateFields.currentSeason = progressData.currentSeason;
    }

    if (progressData.currentEpisode !== undefined) {
      if (progressData.currentEpisode < 1) {
        throw new Error('Episode must be at least 1');
      }
      updateFields.currentEpisode = progressData.currentEpisode;
    }

    // Update watch item
    const updatedItem = await WatchItem.findByIdAndUpdate(
      itemId,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    return updatedItem;
  } catch (error) {
    logger.error(`Update watch progress error: ${error.message}`);
    throw error;
  }
};

/**
 * Soft delete (set status to dropped) a watch item
 */
export const deleteWatchItem = async (itemId, userId) => {
  try {
    const watchItem = await WatchItem.findOneAndUpdate(
      {
        _id: itemId,
        userId
      },
      {
        status: 'dropped'
      },
      {
        new: true
      }
    );

    if (!watchItem) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Delete poster from Cloudinary if exists (only if it's a Cloudinary object, not a URL)
    if (watchItem.poster && typeof watchItem.poster === 'object' && watchItem.poster.publicId) {
      try {
        await deleteImage(watchItem.poster.publicId);
      } catch (error) {
        logger.error(`Failed to delete poster: ${error.message}`);
        // Continue even if deletion fails
      }
    }

    return watchItem;
  } catch (error) {
    logger.error(`Delete watch item error: ${error.message}`);
    throw error;
  }
};
