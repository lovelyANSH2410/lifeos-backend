import { sendSuccess, sendError, sendValidationError } from '../../../utils/response.util.js';
import { HTTP_STATUS } from '../../../config/constants.js';
import * as incomeService from '../income/income.service.js';
import * as fixedExpenseService from '../fixedExpenses/fixedExpense.service.js';
import * as transactionService from '../transactions/transaction.service.js';
import * as fundService from '../funds/fund.service.js';
import * as debtService from '../debts/debt.service.js';
import logger from '../../../utils/logger.util.js';

/**
 * Get monthly money overview
 */
export const getMonthlyOverview = async (req, res, next) => {
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

    // Get income summary for the month
    const incomeSummary = await incomeService.getMonthlySummary(userId, month);
    const totalIncome = incomeSummary.total || 0;

    // Get fixed expenses total (monthly normalized)
    const fixedExpensesTotal = await fixedExpenseService.getMonthlyTotal(userId);

    // Get transactions for the month
    const transactionsSummary = await transactionService.getMonthlyTransactions(userId, month);
    const spentSoFar = transactionsSummary.totalExpenses || 0;

    // Get total savings
    const savingsTotal = await fundService.getTotalSavings(userId);

    // Calculate safe to spend
    const safeToSpend = totalIncome - fixedExpensesTotal - savingsTotal;

    // Get debt summary
    const debtSummary = await debtService.getDebtSummary(userId);

    // Calculate emergency fund status
    // Emergency fund = sum of emergency type funds
    const emergencyFunds = await fundService.getFunds(userId, { type: 'emergency' });
    const emergencyFundAmount = emergencyFunds.reduce((sum, fund) => sum + (fund.currentAmount || 0), 0);

    // Calculate monthly expenses (fixed + average transactions)
    const monthlyExpenses = fixedExpensesTotal + (spentSoFar || 0);
    
    let emergencyFundStatus = 'low';
    if (monthlyExpenses > 0) {
      const monthsCovered = emergencyFundAmount / monthlyExpenses;
      if (monthsCovered >= 3) {
        emergencyFundStatus = 'healthy';
      } else if (monthsCovered >= 1) {
        emergencyFundStatus = 'okay';
      }
    } else if (emergencyFundAmount > 0) {
      emergencyFundStatus = 'healthy'; // If no expenses, any emergency fund is healthy
    }

    const overview = {
      totalIncome,
      fixedExpensesTotal,
      savingsTotal,
      safeToSpend: Math.max(0, safeToSpend), // Don't show negative
      spentSoFar,
      emergencyFundStatus,
      emergencyFundAmount,
      debts: {
        owed: debtSummary.owed,
        receivable: debtSummary.receivable
      }
    };

    return sendSuccess(res, overview, 'Monthly overview retrieved successfully');
  } catch (error) {
    logger.error(`Get monthly overview controller error: ${error.message}`);
    next(error);
  }
};
