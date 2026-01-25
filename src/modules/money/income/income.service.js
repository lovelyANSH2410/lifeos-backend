import Income from './income.model.js';
import logger from '../../../utils/logger.util.js';
import { MESSAGES } from '../../../config/constants.js';

/**
 * Create a new income entry
 */
export const createIncome = async (userId, incomeData) => {
  try {
    const income = await Income.create({
      userId,
      name: incomeData.name.trim(),
      amount: incomeData.amount,
      type: incomeData.type,
      frequency: incomeData.frequency || 'monthly',
      receivedAt: incomeData.receivedAt,
      notes: incomeData.notes?.trim()
    });

    return income;
  } catch (error) {
    logger.error(`Create income error: ${error.message}`);
    throw error;
  }
};

/**
 * Get income entries for a user with optional filters
 */
export const getIncomes = async (userId, filters = {}) => {
  try {
    const { type, frequency, startDate, endDate } = filters;

    const query = { userId };

    if (type) {
      query.type = type;
    }

    if (frequency) {
      query.frequency = frequency;
    }

    if (startDate || endDate) {
      query.receivedAt = {};
      if (startDate) {
        query.receivedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.receivedAt.$lte = new Date(endDate);
      }
    }

    const incomes = await Income.find(query)
      .sort({ receivedAt: -1 })
      .lean();

    return incomes;
  } catch (error) {
    logger.error(`Get incomes error: ${error.message}`);
    throw error;
  }
};

/**
 * Get monthly income summary
 */
export const getMonthlySummary = async (userId, month) => {
  try {
    // Parse month (YYYY-MM format)
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const incomes = await Income.find({
      userId,
      receivedAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const total = incomes.reduce((sum, income) => sum + income.amount, 0);

    // Group by type
    const byType = incomes.reduce((acc, income) => {
      if (!acc[income.type]) {
        acc[income.type] = 0;
      }
      acc[income.type] += income.amount;
      return acc;
    }, {});

    return {
      total,
      count: incomes.length,
      byType,
      incomes
    };
  } catch (error) {
    logger.error(`Get monthly summary error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single income entry by ID
 */
export const getIncomeById = async (incomeId, userId) => {
  try {
    const income = await Income.findOne({
      _id: incomeId,
      userId
    }).lean();

    if (!income) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return income;
  } catch (error) {
    logger.error(`Get income by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete an income entry
 */
export const deleteIncome = async (incomeId, userId) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: incomeId,
      userId
    });

    if (!income) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return income;
  } catch (error) {
    logger.error(`Delete income error: ${error.message}`);
    throw error;
  }
};
