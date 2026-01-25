import Idea from './idea.model.js';
import { uploadImage, deleteImage } from '../../utils/cloudinary.util.js';
import logger from '../../utils/logger.util.js';
import { MESSAGES } from '../../config/constants.js';

/**
 * Create a new idea
 */
export const createIdea = async (userId, ideaData, imageFile = null) => {
  try {
    let image = null;

    // Upload image to Cloudinary if provided
    if (imageFile) {
      try {
        const imageData = await uploadImage(imageFile, 'lifeos/ideas');
        image = {
          publicId: imageData.publicId,
          url: imageData.url
        };
      } catch (error) {
        logger.error(`Failed to upload idea image: ${error.message}`);
        // Continue without image if upload fails
      }
    }

    // Create idea
    const idea = await Idea.create({
      userId,
      title: ideaData.title?.trim(),
      content: ideaData.content.trim(),
      type: ideaData.type,
      source: ideaData.source,
      link: ideaData.link?.trim(),
      image,
      tags: ideaData.tags || [],
      status: ideaData.status || 'inbox',
      revisitAt: ideaData.revisitAt ? new Date(ideaData.revisitAt) : undefined
    });

    return idea;
  } catch (error) {
    logger.error(`Create idea error: ${error.message}`);
    throw error;
  }
};

/**
 * Get ideas for a user with filters
 */
export const getIdeas = async (userId, filters = {}) => {
  try {
    const {
      status = 'inbox', // Default to inbox
      type,
      source,
      tag,
      limit = 20,
      page = 1
    } = filters;

    // Build query
    const query = {
      userId
    };

    // Status filter (default to inbox if not specified)
    query.status = status;

    if (type) {
      query.type = type;
    }

    if (source) {
      query.source = source;
    }

    // Tag filter (search in tags array)
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch ideas
    const ideas = await Idea.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Idea.countDocuments(query);

    return {
      ideas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    logger.error(`Get ideas error: ${error.message}`);
    throw error;
  }
};

/**
 * Get random ideas for reflection
 */
export const getReflectIdeas = async (userId) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find ideas that are in inbox or saved status and older than 7 days
    const ideas = await Idea.find({
      userId,
      status: { $in: ['inbox', 'saved'] },
      createdAt: { $lt: sevenDaysAgo }
    })
      .sort({ createdAt: 1 }) // Oldest first
      .limit(5) // Get up to 5 ideas
      .lean();

    // Shuffle and return 3-5 random ideas
    const shuffled = ideas.sort(() => Math.random() - 0.5);
    const count = Math.min(Math.max(3, shuffled.length), 5);
    
    return shuffled.slice(0, count);
  } catch (error) {
    logger.error(`Get reflect ideas error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single idea by ID
 */
export const getIdeaById = async (ideaId, userId) => {
  try {
    const idea = await Idea.findOne({
      _id: ideaId,
      userId
    }).lean();

    if (!idea) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return idea;
  } catch (error) {
    logger.error(`Get idea by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Update an idea
 */
export const updateIdea = async (ideaId, userId, updateData, imageFile = null) => {
  try {
    const idea = await Idea.findOne({
      _id: ideaId,
      userId
    });

    if (!idea) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Handle image update
    if (imageFile) {
      // Delete old image if exists
      if (idea.image && idea.image.publicId) {
        try {
          await deleteImage(idea.image.publicId);
        } catch (error) {
          logger.error(`Failed to delete old idea image: ${error.message}`);
          // Continue even if deletion fails
        }
      }

      // Upload new image
      try {
        const imageData = await uploadImage(imageFile, 'lifeos/ideas');
        updateData.image = {
          publicId: imageData.publicId,
          url: imageData.url
        };
      } catch (error) {
        logger.error(`Failed to upload new idea image: ${error.message}`);
        // Don't update image if upload fails
        delete updateData.image;
      }
    }

    // Prepare update object
    const updateFields = {};

    if (updateData.title !== undefined) {
      updateFields.title = updateData.title?.trim() || null;
    }
    if (updateData.content !== undefined) {
      updateFields.content = updateData.content.trim();
    }
    if (updateData.type !== undefined) {
      updateFields.type = updateData.type || null;
    }
    if (updateData.source !== undefined) {
      updateFields.source = updateData.source || null;
    }
    if (updateData.link !== undefined) {
      updateFields.link = updateData.link?.trim() || null;
    }
    if (updateData.image !== undefined) {
      updateFields.image = updateData.image;
    }
    if (updateData.tags !== undefined) {
      updateFields.tags = Array.isArray(updateData.tags) ? updateData.tags : [];
    }
    if (updateData.status !== undefined) {
      updateFields.status = updateData.status;
    }
    if (updateData.revisitAt !== undefined) {
      updateFields.revisitAt = updateData.revisitAt ? new Date(updateData.revisitAt) : null;
    }

    // Update idea
    const updatedIdea = await Idea.findByIdAndUpdate(
      ideaId,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    return updatedIdea;
  } catch (error) {
    logger.error(`Update idea error: ${error.message}`);
    throw error;
  }
};

/**
 * Soft delete (archive) an idea
 */
export const deleteIdea = async (ideaId, userId) => {
  try {
    const idea = await Idea.findOneAndUpdate(
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

    if (!idea) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return idea;
  } catch (error) {
    logger.error(`Delete idea error: ${error.message}`);
    throw error;
  }
};
