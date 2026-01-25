import { sendSuccess, sendError, sendValidationError } from '../../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../../config/constants.js';
import * as fundService from './fund.service.js';
import logger from '../../../utils/logger.util.js';

/**
 * Create a new fund
 */
export const createFund = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, type, targetAmount, currentAmount, priority, isLocked } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return sendValidationError(res, [{
        field: 'name',
        message: 'Name is required'
      }]);
    }

    if (!type) {
      return sendValidationError(res, [{
        field: 'type',
        message: 'Type is required'
      }]);
    }

    const validTypes = ['emergency', 'savings', 'goal'];
    if (!validTypes.includes(type)) {
      return sendValidationError(res, [{
        field: 'type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      }]);
    }

    if (targetAmount !== undefined && targetAmount < 0) {
      return sendValidationError(res, [{
        field: 'targetAmount',
        message: 'Target amount must be greater than or equal to 0'
      }]);
    }

    if (currentAmount !== undefined && currentAmount < 0) {
      return sendValidationError(res, [{
        field: 'currentAmount',
        message: 'Current amount must be greater than or equal to 0'
      }]);
    }

    if (priority !== undefined) {
      const priorityNum = parseInt(priority);
      if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 5) {
        return sendValidationError(res, [{
          field: 'priority',
          message: 'Priority must be between 1 and 5'
        }]);
      }
    }

    const fundData = {
      name: name.trim(),
      type,
      targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
      currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
      priority: priority ? parseInt(priority) : 3,
      isLocked: isLocked || false
    };

    const fund = await fundService.createFund(userId, fundData);

    return sendSuccess(
      res,
      fund,
      'Fund created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create fund controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get funds for the logged-in user
 */
export const getFunds = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, isLocked } = req.query;

    const filters = {
      type,
      isLocked
    };

    const funds = await fundService.getFunds(userId, filters);

    return sendSuccess(res, funds, 'Funds retrieved successfully');
  } catch (error) {
    logger.error(`Get funds controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single fund by ID
 */
export const getFundById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const fund = await fundService.getFundById(id, userId);

    return sendSuccess(res, fund, 'Fund retrieved successfully');
  } catch (error) {
    logger.error(`Get fund by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Update a fund
 */
export const updateFund = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, type, targetAmount, priority, isLocked } = req.body;

    // Validate type if provided
    if (type !== undefined) {
      const validTypes = ['emergency', 'savings', 'goal'];
      if (!validTypes.includes(type)) {
        return sendValidationError(res, [{
          field: 'type',
          message: `Type must be one of: ${validTypes.join(', ')}`
        }]);
      }
    }

    // Validate targetAmount if provided
    if (targetAmount !== undefined && targetAmount < 0) {
      return sendValidationError(res, [{
        field: 'targetAmount',
        message: 'Target amount must be greater than or equal to 0'
      }]);
    }

    // Validate priority if provided
    if (priority !== undefined) {
      const priorityNum = parseInt(priority);
      if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 5) {
        return sendValidationError(res, [{
          field: 'priority',
          message: 'Priority must be between 1 and 5'
        }]);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (targetAmount !== undefined) updateData.targetAmount = parseFloat(targetAmount);
    if (priority !== undefined) updateData.priority = parseInt(priority);
    if (isLocked !== undefined) updateData.isLocked = isLocked;

    const fund = await fundService.updateFund(id, userId, updateData);

    return sendSuccess(res, fund, 'Fund updated successfully');
  } catch (error) {
    logger.error(`Update fund controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Add money to a fund
 */
export const addToFund = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, allowLocked } = req.body;

    if (!amount || amount <= 0) {
      return sendValidationError(res, [{
        field: 'amount',
        message: 'Amount is required and must be greater than 0'
      }]);
    }

    const fund = await fundService.addToFund(id, userId, parseFloat(amount), allowLocked);

    return sendSuccess(res, fund, 'Money added to fund successfully');
  } catch (error) {
    logger.error(`Add to fund controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    if (error.message.includes('locked fund') || error.message.includes('Amount must be')) {
      return sendValidationError(res, [{
        field: 'amount',
        message: error.message
      }]);
    }

    next(error);
  }
};

/**
 * Withdraw money from a fund
 */
export const withdrawFromFund = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, allowLocked } = req.body;

    if (!amount || amount <= 0) {
      return sendValidationError(res, [{
        field: 'amount',
        message: 'Amount is required and must be greater than 0'
      }]);
    }

    const fund = await fundService.withdrawFromFund(id, userId, parseFloat(amount), allowLocked);

    return sendSuccess(res, fund, 'Money withdrawn from fund successfully');
  } catch (error) {
    logger.error(`Withdraw from fund controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    if (error.message.includes('locked fund') || error.message.includes('Insufficient funds') || error.message.includes('Amount must be')) {
      return sendValidationError(res, [{
        field: 'amount',
        message: error.message
      }]);
    }

    next(error);
  }
};
