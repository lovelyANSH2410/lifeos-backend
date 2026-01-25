import FixedExpense from './fixedExpense.model.js';
import logger from '../../../utils/logger.util.js';
import { MESSAGES } from '../../../config/constants.js';

/**
 * Create a new fixed expense
 */
export const createFixedExpense = async (userId, expenseData) => {
  try {
    const fixedExpense = await FixedExpense.create({
      userId,
      name: expenseData.name.trim(),
      amount: expenseData.amount,
      category: expenseData.category,
      billingCycle: expenseData.billingCycle || 'monthly',
      dueDate: expenseData.dueDate,
      isActive: expenseData.isActive !== undefined ? expenseData.isActive : true
    });

    return fixedExpense;
  } catch (error) {
    logger.error(`Create fixed expense error: ${error.message}`);
    throw error;
  }
};

/**
 * Get fixed expenses for a user
 */
export const getFixedExpenses = async (userId, filters = {}) => {
  try {
    const { category, billingCycle, isActive } = filters;

    const query = { userId };

    if (category) {
      query.category = category;
    }

    if (billingCycle) {
      query.billingCycle = billingCycle;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    const fixedExpenses = await FixedExpense.find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    return fixedExpenses;
  } catch (error) {
    logger.error(`Get fixed expenses error: ${error.message}`);
    throw error;
  }
};

/**
 * Get total monthly fixed expenses
 */
export const getMonthlyTotal = async (userId) => {
  try {
    const fixedExpenses = await FixedExpense.find({
      userId,
      isActive: true
    }).lean();

    let total = 0;

    fixedExpenses.forEach(expense => {
      if (expense.billingCycle === 'monthly') {
        total += expense.amount;
      } else if (expense.billingCycle === 'yearly') {
        total += expense.amount / 12;
      }
    });

    return total;
  } catch (error) {
    logger.error(`Get monthly total error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single fixed expense by ID
 */
export const getFixedExpenseById = async (expenseId, userId) => {
  try {
    const fixedExpense = await FixedExpense.findOne({
      _id: expenseId,
      userId
    }).lean();

    if (!fixedExpense) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return fixedExpense;
  } catch (error) {
    logger.error(`Get fixed expense by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Update a fixed expense
 */
export const updateFixedExpense = async (expenseId, userId, updateData) => {
  try {
    const fixedExpense = await FixedExpense.findOne({
      _id: expenseId,
      userId
    });

    if (!fixedExpense) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    const updateFields = {};

    if (updateData.name !== undefined) {
      updateFields.name = updateData.name.trim();
    }
    if (updateData.amount !== undefined) {
      updateFields.amount = updateData.amount;
    }
    if (updateData.category !== undefined) {
      updateFields.category = updateData.category;
    }
    if (updateData.billingCycle !== undefined) {
      updateFields.billingCycle = updateData.billingCycle;
    }
    if (updateData.dueDate !== undefined) {
      updateFields.dueDate = updateData.dueDate;
    }
    if (updateData.isActive !== undefined) {
      updateFields.isActive = updateData.isActive;
    }

    const updatedExpense = await FixedExpense.findByIdAndUpdate(
      expenseId,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    return updatedExpense;
  } catch (error) {
    logger.error(`Update fixed expense error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a fixed expense
 */
export const deleteFixedExpense = async (expenseId, userId) => {
  try {
    const fixedExpense = await FixedExpense.findOneAndDelete({
      _id: expenseId,
      userId
    });

    if (!fixedExpense) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return fixedExpense;
  } catch (error) {
    logger.error(`Delete fixed expense error: ${error.message}`);
    throw error;
  }
};
