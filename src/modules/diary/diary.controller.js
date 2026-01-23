import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as diaryService from './diary.service.js';
import logger from '../../utils/logger.util.js';

/**
 * Create a new diary entry
 */
export const createEntry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, content, mood, entryDate, isPinned } = req.body;
    const files = req.files || [];

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return sendValidationError(res, [{
        field: 'content',
        message: 'Content is required'
      }]);
    }

    // Validate content length
    if (content.length > 5000) {
      return sendValidationError(res, [{
        field: 'content',
        message: 'Content cannot exceed 5000 characters'
      }]);
    }

    // Validate title length if provided
    if (title && title.length > 120) {
      return sendValidationError(res, [{
        field: 'title',
        message: 'Title cannot exceed 120 characters'
      }]);
    }

    // Validate mood if provided
    const validMoods = ['calm', 'happy', 'energetic', 'sad', 'nostalgic', 'stressed', 'grateful', 'neutral'];
    if (mood && !validMoods.includes(mood)) {
      return sendValidationError(res, [{
        field: 'mood',
        message: `Mood must be one of: ${validMoods.join(', ')}`
      }]);
    }

    const entryData = {
      title: title?.trim() || undefined,
      content: content.trim(),
      mood: mood || 'neutral',
      entryDate: entryDate ? new Date(entryDate) : undefined,
      isPinned: isPinned === 'true' || isPinned === true
    };

    const diaryEntry = await diaryService.createDiaryEntry(userId, entryData, files);

    return sendSuccess(
      res,
      diaryEntry,
      'Diary entry created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create entry controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get diary entries for the logged-in user
 */
export const getEntries = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      mood,
      fromDate,
      toDate,
      limit,
      page,
      isArchived
    } = req.query;

    const filters = {
      mood,
      fromDate,
      toDate,
      limit: limit || 20,
      page: page || 1,
      isArchived: isArchived === 'true'
    };

    const result = await diaryService.getDiaryEntries(userId, filters);

    return sendSuccess(res, result, 'Diary entries retrieved successfully');
  } catch (error) {
    logger.error(`Get entries controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single diary entry by ID
 */
export const getEntryById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const entry = await diaryService.getDiaryEntryById(id, userId);

    return sendSuccess(res, entry, 'Diary entry retrieved successfully');
  } catch (error) {
    logger.error(`Get entry by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Archive (soft delete) a diary entry
 */
export const archiveEntry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const entry = await diaryService.archiveDiaryEntry(id, userId);

    return sendSuccess(res, entry, 'Diary entry archived successfully');
  } catch (error) {
    logger.error(`Archive entry controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
