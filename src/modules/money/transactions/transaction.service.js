import Transaction from './transaction.model.js';
import logger from '../../../utils/logger.util.js';
import { MESSAGES } from '../../../config/constants.js';

/**
 * Create a new transaction
 */
export const createTransaction = async (userId, transactionData) => {
  try {
    const transaction = await Transaction.create({
      userId,
      amount: transactionData.amount,
      type: transactionData.type,
      category: transactionData.category,
      date: transactionData.date,
      note: transactionData.note?.trim(),
      source: transactionData.source?.trim()
    });

    return transaction;
  } catch (error) {
    logger.error(`Create transaction error: ${error.message}`);
    throw error;
  }
};

/**
 * Get transactions for a user with optional filters
 */
export const getTransactions = async (userId, filters = {}) => {
  try {
    const { type, category, startDate, endDate, limit, page } = filters;

    const query = { userId };

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;
    const skip = (pageNum - 1) * limitNum;

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limitNum)
      .skip(skip)
      .lean();

    const total = await Transaction.countDocuments(query);

    return {
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  } catch (error) {
    logger.error(`Get transactions error: ${error.message}`);
    throw error;
  }
};

/**
 * Get monthly transactions summary
 */
export const getMonthlyTransactions = async (userId, month) => {
  try {
    // Parse month (YYYY-MM format)
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const expenses = transactions.filter(t => t.type === 'expense');
    const incomes = transactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      acc[t.category] += t.amount;
      return acc;
    }, {});

    return {
      totalExpenses,
      totalIncome,
      expensesByCategory,
      transactions
    };
  } catch (error) {
    logger.error(`Get monthly transactions error: ${error.message}`);
    throw error;
  }
};
