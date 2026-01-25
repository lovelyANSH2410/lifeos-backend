import { sendSuccess, sendError, sendValidationError } from '../../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../../config/constants.js';
import * as fixedExpenseService from './fixedExpense.service.js';
import logger from '../../../utils/logger.util.js';

/**
 * Create a new fixed expense
 */
export const createFixedExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, amount, category, billingCycle, dueDate, isActive } = req.body;

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

    if (!category) {
      return sendValidationError(res, [{
        field: 'category',
        message: 'Category is required'
      }]);
    }

    const validCategories = ['rent', 'utilities', 'internet', 'phone', 'insurance', 'emi', 'subscription', 'other'];
    if (!validCategories.includes(category)) {
      return sendValidationError(res, [{
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      }]);
    }

    if (!billingCycle) {
      return sendValidationError(res, [{
        field: 'billingCycle',
        message: 'Billing cycle is required'
      }]);
    }

    const validBillingCycles = ['monthly', 'yearly'];
    if (!validBillingCycles.includes(billingCycle)) {
      return sendValidationError(res, [{
        field: 'billingCycle',
        message: `Billing cycle must be one of: ${validBillingCycles.join(', ')}`
      }]);
    }

    if (dueDate !== undefined && dueDate !== null) {
      const dueDateNum = parseInt(dueDate);
      if (isNaN(dueDateNum) || dueDateNum < 1 || dueDateNum > 31) {
        return sendValidationError(res, [{
          field: 'dueDate',
          message: 'Due date must be between 1 and 31'
        }]);
      }
    }

    const expenseData = {
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      billingCycle,
      dueDate: dueDate ? parseInt(dueDate) : undefined,
      isActive: isActive !== undefined ? isActive : true
    };

    const fixedExpense = await fixedExpenseService.createFixedExpense(userId, expenseData);

    return sendSuccess(
      res,
      fixedExpense,
      'Fixed expense created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create fixed expense controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get fixed expenses for the logged-in user
 */
export const getFixedExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category, billingCycle, isActive } = req.query;

    const filters = {
      category,
      billingCycle,
      isActive
    };

    const fixedExpenses = await fixedExpenseService.getFixedExpenses(userId, filters);

    return sendSuccess(res, fixedExpenses, 'Fixed expenses retrieved successfully');
  } catch (error) {
    logger.error(`Get fixed expenses controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single fixed expense by ID
 */
export const getFixedExpenseById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const fixedExpense = await fixedExpenseService.getFixedExpenseById(id, userId);

    return sendSuccess(res, fixedExpense, 'Fixed expense retrieved successfully');
  } catch (error) {
    logger.error(`Get fixed expense by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Update a fixed expense
 */
export const updateFixedExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, amount, category, billingCycle, dueDate, isActive } = req.body;

    // Validate amount if provided
    if (amount !== undefined && amount !== null) {
      if (amount < 0) {
        return sendValidationError(res, [{
          field: 'amount',
          message: 'Amount must be greater than or equal to 0'
        }]);
      }
    }

    // Validate category if provided
    if (category !== undefined) {
      const validCategories = ['rent', 'utilities', 'internet', 'phone', 'insurance', 'emi', 'subscription', 'other'];
      if (!validCategories.includes(category)) {
        return sendValidationError(res, [{
          field: 'category',
          message: `Category must be one of: ${validCategories.join(', ')}`
        }]);
      }
    }

    // Validate billing cycle if provided
    if (billingCycle !== undefined) {
      const validBillingCycles = ['monthly', 'yearly'];
      if (!validBillingCycles.includes(billingCycle)) {
        return sendValidationError(res, [{
          field: 'billingCycle',
          message: `Billing cycle must be one of: ${validBillingCycles.join(', ')}`
        }]);
      }
    }

    // Validate due date if provided
    if (dueDate !== undefined && dueDate !== null) {
      const dueDateNum = parseInt(dueDate);
      if (isNaN(dueDateNum) || dueDateNum < 1 || dueDateNum > 31) {
        return sendValidationError(res, [{
          field: 'dueDate',
          message: 'Due date must be between 1 and 31'
        }]);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (category !== undefined) updateData.category = category;
    if (billingCycle !== undefined) updateData.billingCycle = billingCycle;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? parseInt(dueDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const fixedExpense = await fixedExpenseService.updateFixedExpense(id, userId, updateData);

    return sendSuccess(res, fixedExpense, 'Fixed expense updated successfully');
  } catch (error) {
    logger.error(`Update fixed expense controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Delete a fixed expense
 */
export const deleteFixedExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const fixedExpense = await fixedExpenseService.deleteFixedExpense(id, userId);

    return sendSuccess(res, fixedExpense, 'Fixed expense deleted successfully');
  } catch (error) {
    logger.error(`Delete fixed expense controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
