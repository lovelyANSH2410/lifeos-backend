import { sendSuccess, sendError, sendValidationError } from '../../../utils/response.util.js';
import { HTTP_STATUS } from '../../../config/constants.js';
import * as transactionService from './transaction.service.js';
import logger from '../../../utils/logger.util.js';

/**
 * Create a new transaction
 */
export const createTransaction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, type, category, date, note, source } = req.body;

    // Validate required fields
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

    const validTypes = ['expense', 'income'];
    if (!validTypes.includes(type)) {
      return sendValidationError(res, [{
        field: 'type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      }]);
    }

    if (!category) {
      return sendValidationError(res, [{
        field: 'category',
        message: 'Category is required'
      }]);
    }

    const validCategories = ['food', 'travel', 'shopping', 'entertainment', 'health', 'misc'];
    if (!validCategories.includes(category)) {
      return sendValidationError(res, [{
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      }]);
    }

    if (!date) {
      return sendValidationError(res, [{
        field: 'date',
        message: 'Date is required'
      }]);
    }

    const transactionDate = new Date(date);
    if (isNaN(transactionDate.getTime())) {
      return sendValidationError(res, [{
        field: 'date',
        message: 'Invalid date format'
      }]);
    }

    if (note && note.length > 500) {
      return sendValidationError(res, [{
        field: 'note',
        message: 'Note cannot exceed 500 characters'
      }]);
    }

    const transactionData = {
      amount: parseFloat(amount),
      type,
      category,
      date: transactionDate,
      note: note?.trim(),
      source: source?.trim()
    };

    const transaction = await transactionService.createTransaction(userId, transactionData);

    return sendSuccess(
      res,
      transaction,
      'Transaction created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create transaction controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get transactions for the logged-in user
 */
export const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, category, startDate, endDate, limit, page } = req.query;

    const filters = {
      type,
      category,
      startDate,
      endDate,
      limit,
      page
    };

    const result = await transactionService.getTransactions(userId, filters);

    return sendSuccess(res, result, 'Transactions retrieved successfully');
  } catch (error) {
    logger.error(`Get transactions controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get monthly transactions summary
 */
export const getMonthlyTransactions = async (req, res, next) => {
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

    const summary = await transactionService.getMonthlyTransactions(userId, month);

    return sendSuccess(res, summary, 'Monthly transactions retrieved successfully');
  } catch (error) {
    logger.error(`Get monthly transactions controller error: ${error.message}`);
    next(error);
  }
};
