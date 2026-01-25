import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as watchService from './watch.service.js';
import logger from '../../utils/logger.util.js';

/**
 * Create a new watch item
 */
export const createWatchItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      type,
      status,
      platforms,
      isFavorite,
      rating,
      moodTags,
      notes,
      currentSeason,
      currentEpisode,
      posterUrl
    } = req.body;
    const posterFile = req.file || null;

    // Validate required fields
    if (!title || !title.trim()) {
      return sendValidationError(res, [{
        field: 'title',
        message: 'Title is required'
      }]);
    }

    if (!type) {
      return sendValidationError(res, [{
        field: 'type',
        message: 'Type is required'
      }]);
    }

    // Validate type
    const validTypes = ['movie', 'series', 'documentary', 'anime', 'short'];
    if (!validTypes.includes(type)) {
      return sendValidationError(res, [{
        field: 'type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      }]);
    }

    // Validate status
    const validStatuses = ['planned', 'watching', 'watched', 'dropped'];
    if (status && !validStatuses.includes(status)) {
      return sendValidationError(res, [{
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }]);
    }

    // Validate rating
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return sendValidationError(res, [{
          field: 'rating',
          message: 'Rating must be between 1 and 5'
        }]);
      }
      if (status !== 'watched') {
        return sendValidationError(res, [{
          field: 'rating',
          message: 'Rating can only be set when status is "watched"'
        }]);
      }
    }

    // Validate notes length
    if (notes && notes.length > 1000) {
      return sendValidationError(res, [{
        field: 'notes',
        message: 'Notes cannot exceed 1000 characters'
      }]);
    }

    // Validate progress fields
    if (type !== 'series') {
      if (currentSeason !== undefined || currentEpisode !== undefined) {
        return sendValidationError(res, [{
          field: 'progress',
          message: 'Progress tracking is only available for series'
        }]);
      }
    } else {
      if (currentSeason !== undefined && currentSeason < 1) {
        return sendValidationError(res, [{
          field: 'currentSeason',
          message: 'Season must be at least 1'
        }]);
      }
      if (currentEpisode !== undefined && currentEpisode < 1) {
        return sendValidationError(res, [{
          field: 'currentEpisode',
          message: 'Episode must be at least 1'
        }]);
      }
    }

    // Parse platforms if provided
    let platformsArray = [];
    if (platforms) {
      if (typeof platforms === 'string') {
        try {
          platformsArray = JSON.parse(platforms);
        } catch (error) {
          platformsArray = platforms.split(',').map(p => p.trim());
        }
      } else if (Array.isArray(platforms)) {
        platformsArray = platforms;
      }
    }

    // Parse moodTags if provided
    let moodTagsArray = [];
    if (moodTags) {
      if (typeof moodTags === 'string') {
        try {
          moodTagsArray = JSON.parse(moodTags);
        } catch (error) {
          moodTagsArray = moodTags.split(',').map(tag => tag.trim());
        }
      } else if (Array.isArray(moodTags)) {
        moodTagsArray = moodTags;
      }
    }

    const itemData = {
      title: title.trim(),
      description: description?.trim(),
      type,
      status: status || 'planned',
      platforms: platformsArray,
      isFavorite: isFavorite === 'true' || isFavorite === true,
      rating: rating ? parseFloat(rating) : undefined,
      moodTags: moodTagsArray,
      notes: notes?.trim(),
      currentSeason: currentSeason ? parseInt(currentSeason) : undefined,
      currentEpisode: currentEpisode ? parseInt(currentEpisode) : undefined,
      posterUrl: posterUrl || null
    };

    const watchItem = await watchService.createWatchItem(userId, itemData, posterFile);

    return sendSuccess(
      res,
      watchItem,
      'Watch item created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create watch item controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get watch items for the logged-in user
 */
export const getWatchItems = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      status,
      type,
      platform,
      isFavorite,
      rating
    } = req.query;

    const filters = {
      status,
      type,
      platform,
      isFavorite,
      rating
    };

    const watchItems = await watchService.getWatchItems(userId, filters);

    return sendSuccess(res, watchItems, 'Watch items retrieved successfully');
  } catch (error) {
    logger.error(`Get watch items controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single watch item by ID
 */
export const getWatchItemById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const watchItem = await watchService.getWatchItemById(id, userId);

    return sendSuccess(res, watchItem, 'Watch item retrieved successfully');
  } catch (error) {
    logger.error(`Get watch item by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Update a watch item
 */
export const updateWatchItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      status,
      rating,
      notes,
      moodTags,
      platforms,
      isFavorite
    } = req.body;

    // Validate status if provided
    const validStatuses = ['planned', 'watching', 'watched', 'dropped'];
    if (status && !validStatuses.includes(status)) {
      return sendValidationError(res, [{
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }]);
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return sendValidationError(res, [{
          field: 'rating',
          message: 'Rating must be between 1 and 5'
        }]);
      }
    }

    // Validate notes length if provided
    if (notes !== undefined && notes && notes.length > 1000) {
      return sendValidationError(res, [{
        field: 'notes',
        message: 'Notes cannot exceed 1000 characters'
      }]);
    }

    // Parse platforms if provided
    let platformsArray = undefined;
    if (platforms !== undefined) {
      if (typeof platforms === 'string') {
        try {
          platformsArray = JSON.parse(platforms);
        } catch (error) {
          platformsArray = platforms.split(',').map(p => p.trim());
        }
      } else if (Array.isArray(platforms)) {
        platformsArray = platforms;
      }
    }

    // Parse moodTags if provided
    let moodTagsArray = undefined;
    if (moodTags !== undefined) {
      if (typeof moodTags === 'string') {
        try {
          moodTagsArray = JSON.parse(moodTags);
        } catch (error) {
          moodTagsArray = moodTags.split(',').map(tag => tag.trim());
        }
      } else if (Array.isArray(moodTags)) {
        moodTagsArray = moodTags;
      }
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating ? parseFloat(rating) : null;
    if (notes !== undefined) updateData.notes = notes?.trim();
    if (moodTagsArray !== undefined) updateData.moodTags = moodTagsArray;
    if (platformsArray !== undefined) updateData.platforms = platformsArray;
    if (isFavorite !== undefined) {
      updateData.isFavorite = isFavorite === 'true' || isFavorite === true;
    }

    const watchItem = await watchService.updateWatchItem(id, userId, updateData);

    return sendSuccess(res, watchItem, 'Watch item updated successfully');
  } catch (error) {
    logger.error(`Update watch item controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    if (error.message.includes('Rating can only be set')) {
      return sendValidationError(res, [{
        field: 'rating',
        message: error.message
      }]);
    }

    next(error);
  }
};

/**
 * Update series progress
 */
export const updateWatchProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      currentSeason,
      currentEpisode
    } = req.body;

    // Validate at least one progress field is provided
    if (currentSeason === undefined && currentEpisode === undefined) {
      return sendValidationError(res, [{
        field: 'progress',
        message: 'At least one progress field (currentSeason or currentEpisode) is required'
      }]);
    }

    // Validate season if provided
    if (currentSeason !== undefined) {
      const seasonNum = parseInt(currentSeason);
      if (isNaN(seasonNum) || seasonNum < 1) {
        return sendValidationError(res, [{
          field: 'currentSeason',
          message: 'Season must be at least 1'
        }]);
      }
    }

    // Validate episode if provided
    if (currentEpisode !== undefined) {
      const episodeNum = parseInt(currentEpisode);
      if (isNaN(episodeNum) || episodeNum < 1) {
        return sendValidationError(res, [{
          field: 'currentEpisode',
          message: 'Episode must be at least 1'
        }]);
      }
    }

    const progressData = {};
    if (currentSeason !== undefined) {
      progressData.currentSeason = parseInt(currentSeason);
    }
    if (currentEpisode !== undefined) {
      progressData.currentEpisode = parseInt(currentEpisode);
    }

    const watchItem = await watchService.updateWatchProgress(id, userId, progressData);

    return sendSuccess(res, watchItem, 'Watch progress updated successfully');
  } catch (error) {
    logger.error(`Update watch progress controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    if (error.message.includes('Progress tracking is only available')) {
      return sendValidationError(res, [{
        field: 'type',
        message: error.message
      }]);
    }

    next(error);
  }
};

/**
 * Delete (set status to dropped) a watch item
 */
export const deleteWatchItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const watchItem = await watchService.deleteWatchItem(id, userId);

    return sendSuccess(res, watchItem, 'Watch item deleted successfully');
  } catch (error) {
    logger.error(`Delete watch item controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
