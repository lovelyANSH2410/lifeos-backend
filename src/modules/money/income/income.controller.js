import { sendSuccess, sendError, sendValidationError } from '../../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../../config/constants.js';
import * as incomeService from './income.service.js';
import logger from '../../../utils/logger.util.js';

/**
 * Create a new income entry
 */
export const createIncome = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, amount, type, frequency, receivedAt, notes } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return sendValidationError(res, [{
        field: 'name',
        message: 'Name is required'
      }]);
    }

    if (amount === undefined || amount === null) {
      return sendValidationError(res, [{
        field: 'amount',
        message: 'Amount is required'
      }]);
    }

    if (amount < 0) {
      return sendValidationError(res, [{
        field: 'amount',
        message: 'Amount must be greater than or equal to 0'
      }]);
    }

    if (!type) {
      return sendValidationError(res, [{
        field: 'type',
        message: 'Type is required'
      }]);
    }

    const validTypes = ['salary', 'freelance', 'bonus', 'side_income', 'refund', 'other'];
    if (!validTypes.includes(type)) {
      return sendValidationError(res, [{
        field: 'type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      }]);
    }

    if (!frequency) {
      return sendValidationError(res, [{
        field: 'frequency',
        message: 'Frequency is required'
      }]);
    }

    const validFrequencies = ['monthly', 'one_time'];
    if (!validFrequencies.includes(frequency)) {
      return sendValidationError(res, [{
        field: 'frequency',
        message: `Frequency must be one of: ${validFrequencies.join(', ')}`
      }]);
    }

    if (!receivedAt) {
      return sendValidationError(res, [{
        field: 'receivedAt',
        message: 'Received date is required'
      }]);
    }

    const receivedDate = new Date(receivedAt);
    if (isNaN(receivedDate.getTime())) {
      return sendValidationError(res, [{
        field: 'receivedAt',
        message: 'Invalid date format'
      }]);
    }

    if (notes && notes.length > 500) {
      return sendValidationError(res, [{
        field: 'notes',
        message: 'Notes cannot exceed 500 characters'
      }]);
    }

    const incomeData = {
      name: name.trim(),
      amount: parseFloat(amount),
      type,
      frequency,
      receivedAt: receivedDate,
      notes: notes?.trim()
    };

    const income = await incomeService.createIncome(userId, incomeData);

    return sendSuccess(
      res,
      income,
      'Income created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create income controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get income entries for the logged-in user
 */
export const getIncomes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, frequency, startDate, endDate } = req.query;

    const filters = {
      type,
      frequency,
      startDate,
      endDate
    };

    const incomes = await incomeService.getIncomes(userId, filters);

    return sendSuccess(res, incomes, 'Incomes retrieved successfully');
  } catch (error) {
    logger.error(`Get incomes controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get monthly income summary
 */
export const getMonthlySummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    if (!month) {
      return sendValidationError(res, [{
        field: 'month',
        message: 'Month parameter is required (format: YYYY-MM)'
      }]);
    }

    // Validate month format
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return sendValidationError(res, [{
        field: 'month',
        message: 'Month must be in YYYY-MM format'
      }]);
    }

    const summary = await incomeService.getMonthlySummary(userId, month);

    return sendSuccess(res, summary, 'Monthly summary retrieved successfully');
  } catch (error) {
    logger.error(`Get monthly summary controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Delete an income entry
 */
export const deleteIncome = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const income = await incomeService.deleteIncome(id, userId);

    return sendSuccess(res, income, 'Income deleted successfully');
  } catch (error) {
    logger.error(`Delete income controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
