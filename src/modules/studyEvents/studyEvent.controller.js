import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as studyEventService from './studyEvent.service.js';
import logger from '../../utils/logger.util.js';

export const createStudyEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, date, isRecurring, recurrence, examId, subjectId, topicId } = req.body;

    if (!title || !title.trim()) {
      return sendValidationError(res, [{ field: 'title', message: 'Title is required' }]);
    }

    if (isRecurring && recurrence) {
      if (recurrence.type === 'weekly' || recurrence.type === 'custom') {
        if (!recurrence.daysOfWeek || !Array.isArray(recurrence.daysOfWeek) || recurrence.daysOfWeek.length === 0) {
          return sendValidationError(res, [{
            field: 'recurrence.daysOfWeek',
            message: 'Days of week are required for weekly/custom recurrence'
          }]);
        }
      }
    }

    const event = await studyEventService.createStudyEvent(userId, {
      title: title.trim(),
      date,
      isRecurring: isRecurring || false,
      recurrence,
      examId,
      subjectId,
      topicId
    });

    const data = event.toObject ? event.toObject() : event;
    return sendSuccess(res, data, 'Study event created', HTTP_STATUS.CREATED);
  } catch (error) {
    logger.error(`Create study event: ${error.message}`);
    next(error);
  }
};

export const getStudyEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    if (!month) {
      return sendValidationError(res, [{ field: 'month', message: 'Month parameter (YYYY-MM) is required' }]);
    }

    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return sendValidationError(res, [{ field: 'month', message: 'Month must be in YYYY-MM format' }]);
    }

    const events = await studyEventService.getStudyEventsForMonth(userId, month);
    return sendSuccess(res, events, 'Study events retrieved');
  } catch (error) {
    logger.error(`Get study events: ${error.message}`);
    next(error);
  }
};

export const getTodayStudyEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const events = await studyEventService.getTodayStudyEvents(userId);
    return sendSuccess(res, events, 'Today\'s study events retrieved');
  } catch (error) {
    logger.error(`Get today study events: ${error.message}`);
    next(error);
  }
};

export const completeStudyEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.params;
    const { date } = req.body;

    const log = await studyEventService.completeStudyEvent(eventId, userId, date);
    const data = log.toObject ? log.toObject() : log;
    return sendSuccess(res, data, 'Study event completed');
  } catch (error) {
    logger.error(`Complete study event: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
