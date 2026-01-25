import Debt from './debt.model.js';
import logger from '../../../utils/logger.util.js';
import { MESSAGES } from '../../../config/constants.js';

/**
 * Create a new debt entry
 */
export const createDebt = async (userId, debtData) => {
  try {
    const debt = await Debt.create({
      userId,
      personName: debtData.personName.trim(),
      amount: debtData.amount,
      type: debtData.type,
      status: debtData.status || 'pending',
      dueDate: debtData.dueDate,
      note: debtData.note?.trim()
    });

    return debt;
  } catch (error) {
    logger.error(`Create debt error: ${error.message}`);
    throw error;
  }
};

/**
 * Get debts for a user
 */
export const getDebts = async (userId, filters = {}) => {
  try {
    const { type, status } = filters;

    const query = { userId };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const debts = await Debt.find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    return debts;
  } catch (error) {
    logger.error(`Get debts error: ${error.message}`);
    throw error;
  }
};

/**
 * Get debt summary (owed and receivable)
 */
export const getDebtSummary = async (userId) => {
  try {
    const debts = await Debt.find({
      userId,
      status: 'pending'
    }).lean();

    const owed = debts
      .filter(d => d.type === 'borrowed')
      .reduce((sum, d) => sum + d.amount, 0);

    const receivable = debts
      .filter(d => d.type === 'lent')
      .reduce((sum, d) => sum + d.amount, 0);

    return {
      owed,
      receivable
    };
  } catch (error) {
    logger.error(`Get debt summary error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single debt by ID
 */
export const getDebtById = async (debtId, userId) => {
  try {
    const debt = await Debt.findOne({
      _id: debtId,
      userId
    }).lean();

    if (!debt) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return debt;
  } catch (error) {
    logger.error(`Get debt by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Settle a debt (mark as settled)
 */
export const settleDebt = async (debtId, userId) => {
  try {
    const debt = await Debt.findOneAndUpdate(
      {
        _id: debtId,
        userId
      },
      {
        status: 'settled'
      },
      {
        new: true
      }
    );

    if (!debt) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return debt;
  } catch (error) {
    logger.error(`Settle debt error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a debt
 */
export const deleteDebt = async (debtId, userId) => {
  try {
    const debt = await Debt.findOneAndDelete({
      _id: debtId,
      userId
    });

    if (!debt) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return debt;
  } catch (error) {
    logger.error(`Delete debt error: ${error.message}`);
    throw error;
  }
};
