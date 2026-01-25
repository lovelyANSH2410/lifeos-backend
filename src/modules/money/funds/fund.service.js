import Fund from './fund.model.js';
import logger from '../../../utils/logger.util.js';
import { MESSAGES } from '../../../config/constants.js';

/**
 * Create a new fund
 */
export const createFund = async (userId, fundData) => {
  try {
    const fund = await Fund.create({
      userId,
      name: fundData.name.trim(),
      type: fundData.type,
      targetAmount: fundData.targetAmount,
      currentAmount: fundData.currentAmount || 0,
      priority: fundData.priority || 3,
      isLocked: fundData.isLocked || false
    });

    return fund;
  } catch (error) {
    logger.error(`Create fund error: ${error.message}`);
    throw error;
  }
};

/**
 * Get funds for a user
 */
export const getFunds = async (userId, filters = {}) => {
  try {
    const { type, isLocked } = filters;

    const query = { userId };

    if (type) {
      query.type = type;
    }

    if (isLocked !== undefined) {
      query.isLocked = isLocked === 'true' || isLocked === true;
    }

    const funds = await Fund.find(query)
      .sort({ priority: 1, createdAt: -1 })
      .lean();

    return funds;
  } catch (error) {
    logger.error(`Get funds error: ${error.message}`);
    throw error;
  }
};

/**
 * Get total savings across all funds
 */
export const getTotalSavings = async (userId) => {
  try {
    const funds = await Fund.find({ userId }).lean();
    const total = funds.reduce((sum, fund) => sum + (fund.currentAmount || 0), 0);
    return total;
  } catch (error) {
    logger.error(`Get total savings error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single fund by ID
 */
export const getFundById = async (fundId, userId) => {
  try {
    const fund = await Fund.findOne({
      _id: fundId,
      userId
    }).lean();

    if (!fund) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return fund;
  } catch (error) {
    logger.error(`Get fund by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Update a fund
 */
export const updateFund = async (fundId, userId, updateData) => {
  try {
    const fund = await Fund.findOne({
      _id: fundId,
      userId
    });

    if (!fund) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    const updateFields = {};

    if (updateData.name !== undefined) {
      updateFields.name = updateData.name.trim();
    }
    if (updateData.type !== undefined) {
      updateFields.type = updateData.type;
    }
    if (updateData.targetAmount !== undefined) {
      updateFields.targetAmount = updateData.targetAmount;
    }
    if (updateData.priority !== undefined) {
      updateFields.priority = updateData.priority;
    }
    if (updateData.isLocked !== undefined) {
      updateFields.isLocked = updateData.isLocked;
    }

    const updatedFund = await Fund.findByIdAndUpdate(
      fundId,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    return updatedFund;
  } catch (error) {
    logger.error(`Update fund error: ${error.message}`);
    throw error;
  }
};

/**
 * Add money to a fund
 */
export const addToFund = async (fundId, userId, amount, allowLocked = false) => {
  try {
    const fund = await Fund.findOne({
      _id: fundId,
      userId
    });

    if (!fund) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    if (fund.isLocked && !allowLocked) {
      throw new Error('Cannot add to locked fund');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    fund.currentAmount = (fund.currentAmount || 0) + amount;

    const updatedFund = await fund.save();

    return updatedFund;
  } catch (error) {
    logger.error(`Add to fund error: ${error.message}`);
    throw error;
  }
};

/**
 * Withdraw money from a fund
 */
export const withdrawFromFund = async (fundId, userId, amount, allowLocked = false) => {
  try {
    const fund = await Fund.findOne({
      _id: fundId,
      userId
    });

    if (!fund) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    if (fund.isLocked && !allowLocked) {
      throw new Error('Cannot withdraw from locked fund');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (fund.currentAmount < amount) {
      throw new Error('Insufficient funds');
    }

    fund.currentAmount = (fund.currentAmount || 0) - amount;

    const updatedFund = await fund.save();

    return updatedFund;
  } catch (error) {
    logger.error(`Withdraw from fund error: ${error.message}`);
    throw error;
  }
};
