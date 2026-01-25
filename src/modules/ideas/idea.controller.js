import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as ideaService from './idea.service.js';
import logger from '../../utils/logger.util.js';

/**
 * Create a new idea
 */
export const createIdea = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      content,
      type,
      source,
      link,
      tags,
      status,
      revisitAt
    } = req.body;
    const imageFile = req.file || null;

    // Validate required fields
    if (!content || !content.trim()) {
      return sendValidationError(res, [{
        field: 'content',
        message: 'Content is required'
      }]);
    }

    if (content.trim().length > 5000) {
      return sendValidationError(res, [{
        field: 'content',
        message: 'Content cannot exceed 5000 characters'
      }]);
    }

    // Validate title length if provided
    if (title && title.trim().length > 150) {
      return sendValidationError(res, [{
        field: 'title',
        message: 'Title cannot exceed 150 characters'
      }]);
    }

    // Validate type if provided
    const validTypes = ['curiosity', 'learning', 'idea', 'inspiration', 'news', 'question', 'random'];
    if (type && !validTypes.includes(type)) {
      return sendValidationError(res, [{
        field: 'type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      }]);
    }

    // Validate source if provided
    const validSources = ['youtube', 'instagram', 'article', 'book', 'conversation', 'random'];
    if (source && !validSources.includes(source)) {
      return sendValidationError(res, [{
        field: 'source',
        message: `Source must be one of: ${validSources.join(', ')}`
      }]);
    }

    // Validate status if provided
    const validStatuses = ['inbox', 'saved', 'explored', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return sendValidationError(res, [{
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }]);
    }

    // Parse tags if provided
    let tagsArray = [];
    if (tags) {
      if (typeof tags === 'string') {
        // If tags is a JSON string, parse it
        try {
          tagsArray = JSON.parse(tags);
        } catch {
          // If not JSON, treat as comma-separated string
          tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }
    }

    const ideaData = {
      title: title?.trim(),
      content: content.trim(),
      type: type || undefined,
      source: source || undefined,
      link: link?.trim(),
      tags: tagsArray,
      status: status || 'inbox',
      revisitAt: revisitAt ? new Date(revisitAt) : undefined
    };

    const idea = await ideaService.createIdea(userId, ideaData, imageFile);

    return sendSuccess(
      res,
      idea,
      'Idea created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create idea controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get ideas for the logged-in user
 */
export const getIdeas = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      status,
      type,
      source,
      tag,
      limit,
      page
    } = req.query;

    const filters = {
      status: status || 'inbox', // Default to inbox
      type,
      source,
      tag,
      limit: limit || 20,
      page: page || 1
    };

    const result = await ideaService.getIdeas(userId, filters);

    return sendSuccess(res, result, 'Ideas retrieved successfully');
  } catch (error) {
    logger.error(`Get ideas controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get random ideas for reflection
 */
export const getReflectIdeas = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const ideas = await ideaService.getReflectIdeas(userId);

    return sendSuccess(res, ideas, 'Reflect ideas retrieved successfully');
  } catch (error) {
    logger.error(`Get reflect ideas controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single idea by ID
 */
export const getIdeaById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const idea = await ideaService.getIdeaById(id, userId);

    return sendSuccess(res, idea, 'Idea retrieved successfully');
  } catch (error) {
    logger.error(`Get idea by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Update an idea
 */
export const updateIdea = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      title,
      content,
      type,
      source,
      link,
      tags,
      status,
      revisitAt
    } = req.body;
    const imageFile = req.file || null;

    // Validate content length if provided
    if (content !== undefined) {
      if (!content || !content.trim()) {
        return sendValidationError(res, [{
          field: 'content',
          message: 'Content is required'
        }]);
      }
      if (content.trim().length > 5000) {
        return sendValidationError(res, [{
          field: 'content',
          message: 'Content cannot exceed 5000 characters'
        }]);
      }
    }

    // Validate title length if provided
    if (title !== undefined && title && title.trim().length > 150) {
      return sendValidationError(res, [{
        field: 'title',
        message: 'Title cannot exceed 150 characters'
      }]);
    }

    // Validate type if provided
    const validTypes = ['curiosity', 'learning', 'idea', 'inspiration', 'news', 'question', 'random'];
    if (type && !validTypes.includes(type)) {
      return sendValidationError(res, [{
        field: 'type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      }]);
    }

    // Validate source if provided
    const validSources = ['youtube', 'instagram', 'article', 'book', 'conversation', 'random'];
    if (source && !validSources.includes(source)) {
      return sendValidationError(res, [{
        field: 'source',
        message: `Source must be one of: ${validSources.join(', ')}`
      }]);
    }

    // Validate status if provided
    const validStatuses = ['inbox', 'saved', 'explored', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return sendValidationError(res, [{
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }]);
    }

    // Parse tags if provided
    let tagsArray = undefined;
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        try {
          tagsArray = JSON.parse(tags);
        } catch {
          tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      } else {
        tagsArray = [];
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title?.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (type !== undefined) updateData.type = type || null;
    if (source !== undefined) updateData.source = source || null;
    if (link !== undefined) updateData.link = link?.trim() || null;
    if (tagsArray !== undefined) updateData.tags = tagsArray;
    if (status !== undefined) updateData.status = status;
    if (revisitAt !== undefined) {
      updateData.revisitAt = revisitAt ? new Date(revisitAt) : null;
    }

    const idea = await ideaService.updateIdea(id, userId, updateData, imageFile);

    return sendSuccess(res, idea, 'Idea updated successfully');
  } catch (error) {
    logger.error(`Update idea controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Delete (archive) an idea
 */
export const deleteIdea = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const idea = await ideaService.deleteIdea(id, userId);

    return sendSuccess(res, idea, 'Idea archived successfully');
  } catch (error) {
    logger.error(`Delete idea controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
