import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as tripService from './trip.service.js';
import logger from '../../utils/logger.util.js';

/**
 * Create a new trip
 */
export const createTrip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      city,
      country,
      startDate,
      endDate,
      budget,
      notes,
      isPinned
    } = req.body;
    const coverImageFile = req.file || null;

    // Validate required fields
    if (!title || !title.trim()) {
      return sendValidationError(res, [{
        field: 'title',
        message: 'Title is required'
      }]);
    }

    if (title.trim().length > 100) {
      return sendValidationError(res, [{
        field: 'title',
        message: 'Title cannot exceed 100 characters'
      }]);
    }

    if (!city || !city.trim()) {
      return sendValidationError(res, [{
        field: 'city',
        message: 'City is required'
      }]);
    }

    if (!country || !country.trim()) {
      return sendValidationError(res, [{
        field: 'country',
        message: 'Country is required'
      }]);
    }

    if (!startDate) {
      return sendValidationError(res, [{
        field: 'startDate',
        message: 'Start date is required'
      }]);
    }

    if (!endDate) {
      return sendValidationError(res, [{
        field: 'endDate',
        message: 'End date is required'
      }]);
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return sendValidationError(res, [{
        field: 'endDate',
        message: 'End date must be after or equal to start date'
      }]);
    }

    // Validate notes length
    if (notes && notes.length > 2000) {
      return sendValidationError(res, [{
        field: 'notes',
        message: 'Notes cannot exceed 2000 characters'
      }]);
    }

    // Validate budget if provided
    let budgetData = null;
    if (budget) {
      const budgetObj = typeof budget === 'string' ? JSON.parse(budget) : budget;
      if (budgetObj.estimated !== undefined) {
        if (budgetObj.estimated < 0) {
          return sendValidationError(res, [{
            field: 'budget.estimated',
            message: 'Budget must be greater than or equal to 0'
          }]);
        }
        budgetData = {
          estimated: parseFloat(budgetObj.estimated),
          currency: budgetObj.currency || 'USD'
        };
      }
    }

    const tripData = {
      title: title.trim(),
      city: city.trim(),
      country: country.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: budgetData,
      notes: notes?.trim(),
      isPinned: isPinned === 'true' || isPinned === true
    };

    const trip = await tripService.createTrip(userId, tripData, coverImageFile);

    // Add daysToGo for upcoming trips
    const enrichedTrip = trip.toObject();
    if (trip.status === 'upcoming') {
      const now = new Date();
      const start = new Date(trip.startDate);
      const diffTime = start.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      enrichedTrip.daysToGo = diffDays > 0 ? diffDays : 0;
    }

    return sendSuccess(
      res,
      enrichedTrip,
      'Trip created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create trip controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get trips for the logged-in user
 */
export const getTrips = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      status,
      limit,
      page
    } = req.query;

    const filters = {
      status,
      limit: limit || 20,
      page: page || 1
    };

    const result = await tripService.getTrips(userId, filters);

    return sendSuccess(res, result, 'Trips retrieved successfully');
  } catch (error) {
    logger.error(`Get trips controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get trip summary
 */
export const getTripSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const summary = await tripService.getTripSummary(userId);

    return sendSuccess(res, summary, 'Trip summary retrieved successfully');
  } catch (error) {
    logger.error(`Get trip summary controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single trip by ID
 */
export const getTripById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const trip = await tripService.getTripById(id, userId);

    return sendSuccess(res, trip, 'Trip retrieved successfully');
  } catch (error) {
    logger.error(`Get trip by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Update a trip
 */
export const updateTrip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      title,
      city,
      country,
      startDate,
      endDate,
      status,
      budget,
      notes,
      isPinned
    } = req.body;
    const coverImageFile = req.file || null;

    // Validate title if provided
    if (title !== undefined) {
      if (!title || !title.trim()) {
        return sendValidationError(res, [{
          field: 'title',
          message: 'Title is required'
        }]);
      }
      if (title.trim().length > 100) {
        return sendValidationError(res, [{
          field: 'title',
          message: 'Title cannot exceed 100 characters'
        }]);
      }
    }

    // Validate status if provided
    const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return sendValidationError(res, [{
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }]);
    }

    // Validate notes length if provided
    if (notes && notes.length > 2000) {
      return sendValidationError(res, [{
        field: 'notes',
        message: 'Notes cannot exceed 2000 characters'
      }]);
    }

    // Parse budget if provided
    let budgetData = undefined;
    if (budget) {
      const budgetObj = typeof budget === 'string' ? JSON.parse(budget) : budget;
      if (budgetObj.estimated !== undefined) {
        if (budgetObj.estimated < 0) {
          return sendValidationError(res, [{
            field: 'budget.estimated',
            message: 'Budget must be greater than or equal to 0'
          }]);
        }
        budgetData = {
          estimated: parseFloat(budgetObj.estimated),
          currency: budgetObj.currency || 'USD'
        };
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (country !== undefined) updateData.country = country.trim();
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;
    if (budgetData !== undefined) updateData.budget = budgetData;
    if (notes !== undefined) updateData.notes = notes;
    if (isPinned !== undefined) {
      updateData.isPinned = isPinned === 'true' || isPinned === true;
    }

    const trip = await tripService.updateTrip(id, userId, updateData, coverImageFile);

    // Add daysToGo for upcoming trips
    const enrichedTrip = trip.toObject();
    if (trip.status === 'upcoming') {
      const now = new Date();
      const start = new Date(trip.startDate);
      const diffTime = start.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      enrichedTrip.daysToGo = diffDays > 0 ? diffDays : 0;
    }

    return sendSuccess(res, enrichedTrip, 'Trip updated successfully');
  } catch (error) {
    logger.error(`Update trip controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Delete (cancel) a trip
 */
export const deleteTrip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const trip = await tripService.cancelTrip(id, userId);

    return sendSuccess(res, trip, 'Trip cancelled successfully');
  } catch (error) {
    logger.error(`Delete trip controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
