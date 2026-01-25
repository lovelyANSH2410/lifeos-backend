import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as giftingService from './gifting.service.js';
import logger from '../../utils/logger.util.js';

/**
 * Create a new gift idea
 */
export const createGiftIdea = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      type,
      location,
      price,
      link,
      tags,
      status,
      isFavorite,
      source
    } = req.body;
    const imageFiles = req.files || [];

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

    if (!type) {
      return sendValidationError(res, [{
        field: 'type',
        message: 'Type is required'
      }]);
    }

    // Validate type
    const validTypes = ['cafe', 'stay', 'gift', 'activity', 'experience', 'other'];
    if (!validTypes.includes(type)) {
      return sendValidationError(res, [{
        field: 'type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      }]);
    }

    // Validate description length
    if (description && description.length > 1000) {
      return sendValidationError(res, [{
        field: 'description',
        message: 'Description cannot exceed 1000 characters'
      }]);
    }

    // Validate status
    const validStatuses = ['idea', 'planned', 'used', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return sendValidationError(res, [{
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }]);
    }

    // Validate image count
    if (imageFiles.length > 3) {
      return sendValidationError(res, [{
        field: 'images',
        message: 'Maximum 3 images allowed'
      }]);
    }

    // Parse location if provided
    let locationData = null;
    if (location) {
      try {
        const locationObj = typeof location === 'string' ? JSON.parse(location) : location;
        locationData = {
          name: locationObj.name?.trim(),
          city: locationObj.city?.trim(),
          country: locationObj.country?.trim()
        };
      } catch (error) {
        return sendValidationError(res, [{
          field: 'location',
          message: 'Invalid location format'
        }]);
      }
    }

    // Parse price if provided
    let priceData = null;
    if (price) {
      try {
        const priceObj = typeof price === 'string' ? JSON.parse(price) : price;
        if (priceObj.amount !== undefined) {
          if (priceObj.amount < 0) {
            return sendValidationError(res, [{
              field: 'price.amount',
              message: 'Price amount must be greater than or equal to 0'
            }]);
          }
          priceData = {
            amount: parseFloat(priceObj.amount),
            currency: priceObj.currency?.toUpperCase() || 'USD'
          };
        }
      } catch (error) {
        return sendValidationError(res, [{
          field: 'price',
          message: 'Invalid price format'
        }]);
      }
    }

    // Parse tags if provided
    let tagsArray = [];
    if (tags) {
      try {
        if (typeof tags === 'string') {
          tagsArray = JSON.parse(tags);
        } else if (Array.isArray(tags)) {
          tagsArray = tags;
        }
        // Validate tag count
        if (tagsArray.length > 5) {
          return sendValidationError(res, [{
            field: 'tags',
            message: 'Maximum 5 tags allowed'
          }]);
        }
      } catch (error) {
        return sendValidationError(res, [{
          field: 'tags',
          message: 'Invalid tags format'
        }]);
      }
    }

    const ideaData = {
      title: title.trim(),
      description: description?.trim(),
      type,
      location: locationData,
      price: priceData,
      link: link?.trim(),
      tags: tagsArray,
      status: status || 'idea',
      isFavorite: isFavorite === 'true' || isFavorite === true,
      source: source?.trim()
    };

    const giftIdea = await giftingService.createGiftIdea(userId, ideaData, imageFiles);

    return sendSuccess(
      res,
      giftIdea,
      'Gift idea created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create gift idea controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get gift ideas for the logged-in user
 */
export const getGiftIdeas = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      type,
      status,
      isFavorite
    } = req.query;

    const filters = {
      type,
      status,
      isFavorite
    };

    const giftIdeas = await giftingService.getGiftIdeas(userId, filters);

    return sendSuccess(res, giftIdeas, 'Gift ideas retrieved successfully');
  } catch (error) {
    logger.error(`Get gift ideas controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single gift idea by ID
 */
export const getGiftIdeaById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const giftIdea = await giftingService.getGiftIdeaById(id, userId);

    return sendSuccess(res, giftIdea, 'Gift idea retrieved successfully');
  } catch (error) {
    logger.error(`Get gift idea by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Update a gift idea
 */
export const updateGiftIdea = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      title,
      description,
      status,
      price,
      isFavorite
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

    // Validate description length if provided
    if (description !== undefined && description && description.length > 1000) {
      return sendValidationError(res, [{
        field: 'description',
        message: 'Description cannot exceed 1000 characters'
      }]);
    }

    // Validate status if provided
    const validStatuses = ['idea', 'planned', 'used', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return sendValidationError(res, [{
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }]);
    }

    // Parse price if provided
    let priceData = undefined;
    if (price !== undefined) {
      if (price === null) {
        priceData = null;
      } else {
        try {
          const priceObj = typeof price === 'string' ? JSON.parse(price) : price;
          if (priceObj.amount !== undefined) {
            if (priceObj.amount < 0) {
              return sendValidationError(res, [{
                field: 'price.amount',
                message: 'Price amount must be greater than or equal to 0'
              }]);
            }
            priceData = {
              amount: parseFloat(priceObj.amount),
              currency: priceObj.currency?.toUpperCase() || 'USD'
            };
          }
        } catch (error) {
          return sendValidationError(res, [{
            field: 'price',
            message: 'Invalid price format'
          }]);
        }
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (status !== undefined) updateData.status = status;
    if (priceData !== undefined) updateData.price = priceData;
    if (isFavorite !== undefined) {
      updateData.isFavorite = isFavorite === 'true' || isFavorite === true;
    }

    const giftIdea = await giftingService.updateGiftIdea(id, userId, updateData);

    return sendSuccess(res, giftIdea, 'Gift idea updated successfully');
  } catch (error) {
    logger.error(`Update gift idea controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Delete (archive) a gift idea
 */
export const deleteGiftIdea = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const giftIdea = await giftingService.deleteGiftIdea(id, userId);

    return sendSuccess(res, giftIdea, 'Gift idea archived successfully');
  } catch (error) {
    logger.error(`Delete gift idea controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
