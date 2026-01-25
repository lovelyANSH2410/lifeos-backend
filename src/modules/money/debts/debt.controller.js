import { sendSuccess, sendError, sendValidationError } from '../../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../../config/constants.js';
import * as debtService from './debt.service.js';
import logger from '../../../utils/logger.util.js';

/**
 * Create a new debt entry
 */
export const createDebt = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { personName, amount, type, dueDate, note } = req.body;

    // Validate required fields
    if (!personName || !personName.trim()) {
      return sendValidationError(res, [{
        field: 'personName',
        message: 'Person name is required'
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

    const validTypes = ['lent', 'borrowed'];
    if (!validTypes.includes(type)) {
      return sendValidationError(res, [{
        field: 'type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      }]);
    }

    if (note && note.length > 500) {
      return sendValidationError(res, [{
        field: 'note',
        message: 'Note cannot exceed 500 characters'
      }]);
    }

    let dueDateObj = null;
    if (dueDate) {
      dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return sendValidationError(res, [{
          field: 'dueDate',
          message: 'Invalid date format'
        }]);
      }
    }

    const debtData = {
      personName: personName.trim(),
      amount: parseFloat(amount),
      type,
      dueDate: dueDateObj,
      note: note?.trim()
    };

    const debt = await debtService.createDebt(userId, debtData);

    return sendSuccess(
      res,
      debt,
      'Debt created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create debt controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get debts for the logged-in user
 */
export const getDebts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, status } = req.query;

    const filters = {
      type,
      status
    };

    const debts = await debtService.getDebts(userId, filters);

    return sendSuccess(res, debts, 'Debts retrieved successfully');
  } catch (error) {
    logger.error(`Get debts controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single debt by ID
 */
export const getDebtById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const debt = await debtService.getDebtById(id, userId);

    return sendSuccess(res, debt, 'Debt retrieved successfully');
  } catch (error) {
    logger.error(`Get debt by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Settle a debt
 */
export const settleDebt = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const debt = await debtService.settleDebt(id, userId);

    return sendSuccess(res, debt, 'Debt settled successfully');
  } catch (error) {
    logger.error(`Settle debt controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Delete a debt
 */
export const deleteDebt = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const debt = await debtService.deleteDebt(id, userId);

    return sendSuccess(res, debt, 'Debt deleted successfully');
  } catch (error) {
    logger.error(`Delete debt controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
