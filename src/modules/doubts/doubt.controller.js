import mongoose from 'mongoose';
import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as doubtService from './doubt.service.js';
import logger from '../../utils/logger.util.js';

const { Types } = mongoose;

const isValidObjectId = (id) => Types.ObjectId.isValid(id);

export const createDoubt = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.params;
    const { topicId, title, description, priority } = req.body;

    if (!isValidObjectId(subjectId)) {
      return sendValidationError(res, [
        { field: 'subjectId', message: 'Invalid subject ID' }
      ]);
    }

    if (!title || !title.trim()) {
      return sendValidationError(res, [
        { field: 'title', message: 'Title is required' }
      ]);
    }

    if (topicId && !isValidObjectId(topicId)) {
      return sendValidationError(res, [
        { field: 'topicId', message: 'Invalid topic ID' }
      ]);
    }

    const allowedPriorities = ['low', 'medium', 'high'];
    if (priority && !allowedPriorities.includes(priority)) {
      return sendValidationError(res, [
        {
          field: 'priority',
          message: `Priority must be one of: ${allowedPriorities.join(', ')}`
        }
      ]);
    }

    let parsedImages = [];
    if (req.body.images) {
      try {
        const raw = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        if (Array.isArray(raw)) {
          parsedImages = raw;
        }
      } catch (e) {
        logger.warn(`Failed to parse images payload for doubt: ${e.message}`);
      }
    }

    const payload = {
      topicId,
      title,
      description,
      images: parsedImages,
      priority
    };

    const files = Array.isArray(req.files) ? req.files : [];

    const doubt = await doubtService.createDoubt(userId, subjectId, payload, files);

    return sendSuccess(res, doubt, 'Doubt created', HTTP_STATUS.CREATED);
  } catch (error) {
    logger.error(`Create doubt controller error: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const getDoubtsBySubject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.params;
    const { status, priority } = req.query;

    if (!isValidObjectId(subjectId)) {
      return sendValidationError(res, [
        { field: 'subjectId', message: 'Invalid subject ID' }
      ]);
    }

    const filters = {};

    const allowedStatuses = ['open', 'resolved'];
    if (status) {
      if (!allowedStatuses.includes(status)) {
        return sendValidationError(res, [
          {
            field: 'status',
            message: `Status must be one of: ${allowedStatuses.join(', ')}`
          }
        ]);
      }
      filters.status = status;
    }

    const allowedPriorities = ['low', 'medium', 'high'];
    if (priority) {
      if (!allowedPriorities.includes(priority)) {
        return sendValidationError(res, [
          {
            field: 'priority',
            message: `Priority must be one of: ${allowedPriorities.join(', ')}`
          }
        ]);
      }
      filters.priority = priority;
    }

    const doubts = await doubtService.getDoubtsBySubject(
      userId,
      subjectId,
      filters
    );

    return sendSuccess(res, doubts, 'Doubts retrieved');
  } catch (error) {
    logger.error(`Get doubts by subject controller error: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const getDoubtById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendValidationError(res, [
        { field: 'id', message: 'Invalid doubt ID' }
      ]);
    }

    const doubt = await doubtService.getDoubtById(id, userId);

    return sendSuccess(res, doubt, 'Doubt retrieved');
  } catch (error) {
    logger.error(`Get doubt by id controller error: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const updateDoubt = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, priority, topicId } = req.body;

    if (!isValidObjectId(id)) {
      return sendValidationError(res, [
        { field: 'id', message: 'Invalid doubt ID' }
      ]);
    }

    const updates = {};

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return sendValidationError(res, [
          { field: 'title', message: 'Title cannot be empty' }
        ]);
      }
      updates.title = title;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (priority !== undefined) {
      const allowedPriorities = ['low', 'medium', 'high'];
      if (!allowedPriorities.includes(priority)) {
        return sendValidationError(res, [
          {
            field: 'priority',
            message: `Priority must be one of: ${allowedPriorities.join(', ')}`
          }
        ]);
      }
      updates.priority = priority;
    }

    if (topicId !== undefined) {
      if (topicId && !isValidObjectId(topicId)) {
        return sendValidationError(res, [
          { field: 'topicId', message: 'Invalid topic ID' }
        ]);
      }
      updates.topicId = topicId || null;
    }

    if (req.body.images !== undefined) {
      try {
        const raw =
          typeof req.body.images === 'string'
            ? JSON.parse(req.body.images)
            : req.body.images;
        if (Array.isArray(raw)) {
          updates.images = raw;
        }
      } catch (e) {
        logger.warn(`Failed to parse images payload for doubt update: ${e.message}`);
      }
    }

    const files = Array.isArray(req.files) ? req.files : [];

    const doubt = await doubtService.updateDoubt(id, userId, updates, files);

    return sendSuccess(res, doubt, 'Doubt updated');
  } catch (error) {
    logger.error(`Update doubt controller error: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const resolveDoubt = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { resolutionNote } = req.body;

    if (!isValidObjectId(id)) {
      return sendValidationError(res, [
        { field: 'id', message: 'Invalid doubt ID' }
      ]);
    }

    const doubt = await doubtService.resolveDoubt(
      id,
      userId,
      resolutionNote
    );

    return sendSuccess(res, doubt, 'Doubt resolved');
  } catch (error) {
    logger.error(`Resolve doubt controller error: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const deleteDoubt = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendValidationError(res, [
        { field: 'id', message: 'Invalid doubt ID' }
      ]);
    }

    await doubtService.deleteDoubt(id, userId);

    return sendSuccess(res, null, 'Doubt deleted');
  } catch (error) {
    logger.error(`Delete doubt controller error: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

