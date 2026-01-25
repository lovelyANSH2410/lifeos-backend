import GiftIdea from './gifting.model.js';
import { uploadImage, deleteImages } from '../../utils/cloudinary.util.js';
import logger from '../../utils/logger.util.js';
import { MESSAGES } from '../../config/constants.js';

/**
 * Create a new gift idea
 */
export const createGiftIdea = async (userId, ideaData, imageFiles = []) => {
  try {
    // Upload images to Cloudinary if provided
    const images = [];
    if (imageFiles && imageFiles.length > 0) {
      // Limit to 3 images
      const filesToUpload = imageFiles.slice(0, 3);
      for (const file of filesToUpload) {
        try {
          const imageData = await uploadImage(file, 'lifeos/gifting');
          images.push(imageData);
        } catch (error) {
          logger.error(`Failed to upload image: ${error.message}`);
          // Continue with other images even if one fails
        }
      }
    }

    // Create gift idea
    const giftIdea = await GiftIdea.create({
      userId,
      title: ideaData.title.trim(),
      description: ideaData.description?.trim(),
      type: ideaData.type,
      location: ideaData.location ? {
        name: ideaData.location.name?.trim(),
        city: ideaData.location.city?.trim(),
        country: ideaData.location.country?.trim()
      } : undefined,
      price: ideaData.price ? {
        amount: ideaData.price.amount,
        currency: ideaData.price.currency?.toUpperCase()
      } : undefined,
      link: ideaData.link?.trim(),
      images,
      tags: ideaData.tags || [],
      status: ideaData.status || 'idea',
      isFavorite: ideaData.isFavorite || false,
      source: ideaData.source?.trim()
    });

    return giftIdea;
  } catch (error) {
    logger.error(`Create gift idea error: ${error.message}`);
    throw error;
  }
};

/**
 * Get gift ideas for a user with filters
 */
export const getGiftIdeas = async (userId, filters = {}) => {
  try {
    const {
      type,
      status,
      isFavorite
    } = filters;

    // Build query
    const query = {
      userId
    };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (isFavorite !== undefined) {
      query.isFavorite = isFavorite === 'true' || isFavorite === true;
    }

    // Fetch gift ideas, sorted by newest first
    const giftIdeas = await GiftIdea.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return giftIdeas;
  } catch (error) {
    logger.error(`Get gift ideas error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single gift idea by ID
 */
export const getGiftIdeaById = async (ideaId, userId) => {
  try {
    const giftIdea = await GiftIdea.findOne({
      _id: ideaId,
      userId
    }).lean();

    if (!giftIdea) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return giftIdea;
  } catch (error) {
    logger.error(`Get gift idea by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Update a gift idea
 */
export const updateGiftIdea = async (ideaId, userId, updateData) => {
  try {
    const giftIdea = await GiftIdea.findOne({
      _id: ideaId,
      userId
    });

    if (!giftIdea) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Prepare update object
    const updateFields = {};

    if (updateData.title !== undefined) {
      updateFields.title = updateData.title.trim();
    }
    if (updateData.description !== undefined) {
      updateFields.description = updateData.description?.trim() || null;
    }
    if (updateData.status !== undefined) {
      updateFields.status = updateData.status;
    }
    if (updateData.isFavorite !== undefined) {
      updateFields.isFavorite = updateData.isFavorite;
    }
    if (updateData.price !== undefined) {
      if (updateData.price === null) {
        updateFields.price = null;
      } else {
        updateFields.price = {
          amount: updateData.price.amount,
          currency: updateData.price.currency?.toUpperCase()
        };
      }
    }

    // Update gift idea
    const updatedIdea = await GiftIdea.findByIdAndUpdate(
      ideaId,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    return updatedIdea;
  } catch (error) {
    logger.error(`Update gift idea error: ${error.message}`);
    throw error;
  }
};

/**
 * Soft delete (archive) a gift idea
 */
export const deleteGiftIdea = async (ideaId, userId) => {
  try {
    const giftIdea = await GiftIdea.findOneAndUpdate(
      {
        _id: ideaId,
        userId
      },
      {
        status: 'archived'
      },
      {
        new: true
      }
    );

    if (!giftIdea) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Delete images from Cloudinary if exists
    if (giftIdea.images && giftIdea.images.length > 0) {
      try {
        const publicIds = giftIdea.images.map(img => img.publicId);
        await deleteImages(publicIds);
      } catch (error) {
        logger.error(`Failed to delete images: ${error.message}`);
        // Continue even if deletion fails
      }
    }

    return giftIdea;
  } catch (error) {
    logger.error(`Delete gift idea error: ${error.message}`);
    throw error;
  }
};
