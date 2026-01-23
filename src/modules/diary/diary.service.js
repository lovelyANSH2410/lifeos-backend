import DiaryEntry from './diary.model.js';
import { uploadImage, deleteImages } from '../../utils/cloudinary.util.js';
import logger from '../../utils/logger.util.js';
import { MESSAGES } from '../../config/constants.js';

/**
 * Create a new diary entry
 */
export const createDiaryEntry = async (userId, entryData, files = []) => {
  try {
    // Upload images to Cloudinary if provided
    const images = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          // Pass the entire file object (multer provides buffer and mimetype)
          const imageData = await uploadImage(file, 'diary-entries');
          images.push(imageData);
        } catch (error) {
          logger.error(`Failed to upload image: ${error.message}`);
          // Continue with other images even if one fails
        }
      }
    }

    // Create diary entry
    const diaryEntry = await DiaryEntry.create({
      userId,
      title: entryData.title,
      content: entryData.content,
      mood: entryData.mood || 'neutral',
      entryDate: entryData.entryDate ? new Date(entryData.entryDate) : new Date(),
      images,
      isPinned: entryData.isPinned || false
    });

    return diaryEntry;
  } catch (error) {
    logger.error(`Create diary entry error: ${error.message}`);
    throw error;
  }
};

/**
 * Get diary entries for a user with filters
 */
export const getDiaryEntries = async (userId, filters = {}) => {
  try {
    const {
      mood,
      fromDate,
      toDate,
      limit = 20,
      page = 1,
      isArchived = false
    } = filters;

    // Build query
    const query = {
      userId,
      isArchived
    };

    // Filter by mood
    if (mood) {
      query.mood = mood;
    }

    // Filter by date range
    if (fromDate || toDate) {
      query.entryDate = {};
      if (fromDate) {
        query.entryDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.entryDate.$lte = new Date(toDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch entries
    const entries = await DiaryEntry.find(query)
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await DiaryEntry.countDocuments(query);

    return {
      entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    logger.error(`Get diary entries error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single diary entry by ID
 */
export const getDiaryEntryById = async (entryId, userId) => {
  try {
    const entry = await DiaryEntry.findOne({
      _id: entryId,
      userId,
      isArchived: false
    });

    if (!entry) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return entry;
  } catch (error) {
    logger.error(`Get diary entry by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Soft delete (archive) a diary entry
 */
export const archiveDiaryEntry = async (entryId, userId) => {
  try {
    const entry = await DiaryEntry.findOne({
      _id: entryId,
      userId
    });

    if (!entry) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Delete images from Cloudinary
    if (entry.images && entry.images.length > 0) {
      const publicIds = entry.images.map(img => img.publicId);
      try {
        await deleteImages(publicIds);
      } catch (error) {
        logger.error(`Failed to delete images from Cloudinary: ${error.message}`);
        // Continue with archiving even if image deletion fails
      }
    }

    // Archive the entry
    entry.isArchived = true;
    await entry.save();

    return entry;
  } catch (error) {
    logger.error(`Archive diary entry error: ${error.message}`);
    throw error;
  }
};
