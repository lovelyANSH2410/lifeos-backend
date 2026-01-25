import User from '../auth/auth.schema.js';
import Trip from '../trips/trip.model.js';
import Subscription from '../subscriptions/subscription.model.js';
import FixedExpense from '../money/fixedExpenses/fixedExpense.model.js';
import Income from '../money/income/income.model.js';
import Transaction from '../money/transactions/transaction.model.js';
import Debt from '../money/debts/debt.model.js';
import Fund from '../money/funds/fund.model.js';
import WatchItem from '../watch/watch.model.js';
import DiaryEntry from '../diary/diary.model.js';
import Idea from '../ideas/idea.model.js';
import logger from '../../utils/logger.util.js';

/**
 * Calculate days difference between two dates
 */
const calculateDaysDifference = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Build greeting message based on time of day
 */
const buildGreetingMessage = (name) => {
  const hour = new Date().getHours();
  let greeting;
  
  if (hour < 12) {
    greeting = 'Good Morning';
  } else if (hour < 17) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }
  
  // Extract first name (first word of name)
  const firstName = name ? name.split(' ')[0] : 'there';
  
  return `${greeting}, ${firstName}`;
};

/**
 * Get current month in YYYY-MM format
 */
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get start and end dates for current month
 */
const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  return { startDate, endDate };
};

/**
 * Get next upcoming trip
 */
const getNextTrip = async (userId) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    const trip = await Trip.findOne({
      userId,
      startDate: { $gte: now },
      status: { $ne: 'cancelled' }
    })
      .sort({ startDate: 1 })
      .select('title startDate endDate coverImage')
      .lean();
    
    if (!trip) {
      return null;
    }
    
    return {
      title: trip.title,
      startDate: trip.startDate,
      endDate: trip.endDate || null,
      startsInDays: calculateDaysDifference(trip.startDate),
      image: trip.coverImage?.url || null
    };
  } catch (error) {
    logger.error(`Get next trip error: ${error.message}`);
    return null;
  }
};

/**
 * Get next subscription renewal
 */
const getNextSubscription = async (userId) => {
  try {
    const now = new Date();
    
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      renewalDate: { $gte: now }
    })
      .sort({ renewalDate: 1 })
      .select('name amount renewalDate currency')
      .lean();
    
    if (!subscription) {
      return null;
    }
    
    const renewsInDays = calculateDaysDifference(subscription.renewalDate);
    
    return {
      name: subscription.name,
      amount: subscription.amount,
      currency: subscription.currency || 'INR',
      renewsInDays: renewsInDays
    };
  } catch (error) {
    logger.error(`Get next subscription error: ${error.message}`);
    return null;
  }
};

/**
 * Get next fixed expense payment
 */
const getNextPayment = async (userId) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get active fixed expenses with due dates
    const expenses = await FixedExpense.find({
      userId,
      isActive: true,
      dueDate: { $exists: true, $ne: null, $gte: 1, $lte: 31 }
    })
      .select('name amount dueDate billingCycle')
      .lean();
    
    if (expenses.length === 0) {
      return null;
    }
    
    // Find the next payment due
    let nextPayment = null;
    let minDays = Infinity;
    
    expenses.forEach(expense => {
      if (expense.dueDate && expense.dueDate >= 1 && expense.dueDate <= 31) {
        // Calculate next occurrence of this due date
        let nextDueDate = new Date(currentYear, currentMonth, expense.dueDate);
        nextDueDate.setHours(0, 0, 0, 0);
        
        // Handle edge case: if day doesn't exist in current month (e.g., Feb 30)
        if (nextDueDate.getDate() !== expense.dueDate) {
          // Move to last day of current month
          nextDueDate = new Date(currentYear, currentMonth + 1, 0);
        }
        
        // If the due date has passed this month, move to next month
        if (nextDueDate < now) {
          nextDueDate = new Date(currentYear, currentMonth + 1, expense.dueDate);
          nextDueDate.setHours(0, 0, 0, 0);
          // Handle edge case again for next month
          if (nextDueDate.getDate() !== expense.dueDate) {
            nextDueDate = new Date(currentYear, currentMonth + 2, 0);
          }
        }
        
        const daysUntil = calculateDaysDifference(nextDueDate);
        
        if (daysUntil < minDays) {
          minDays = daysUntil;
          nextPayment = {
            title: expense.name,
            amount: expense.billingCycle === 'yearly' ? expense.amount / 12 : expense.amount,
            dueInDays: daysUntil
          };
        }
      }
    });
    
    return nextPayment;
  } catch (error) {
    logger.error(`Get next payment error: ${error.message}`);
    return null;
  }
};

/**
 * Get money snapshot
 */
const getMoneySnapshot = async (userId) => {
  try {
    const currentMonth = getCurrentMonth();
    const { startDate, endDate } = getCurrentMonthRange();
    
    // Get monthly income total
    const monthlyIncome = await Income.aggregate([
      {
        $match: {
          userId: userId,
          frequency: 'monthly'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const monthlyBudget = monthlyIncome.length > 0 ? monthlyIncome[0].total : 0;
    
    // Get monthly spent (expenses from transactions)
    const monthlySpent = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const spent = monthlySpent.length > 0 ? monthlySpent[0].total : 0;
    
    // Get borrowed and lent totals
    const debtSummary = await Debt.aggregate([
      {
        $match: {
          userId: userId,
          status: 'pending'
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    let borrowed = 0;
    let lent = 0;
    
    debtSummary.forEach(item => {
      if (item._id === 'borrowed') {
        borrowed = item.total;
      } else if (item._id === 'lent') {
        lent = item.total;
      }
    });
    
    // Calculate current balance (total funds)
    const funds = await Fund.find({ userId })
      .select('currentAmount')
      .lean();
    
    const currentBalance = funds.reduce((sum, fund) => sum + (fund.currentAmount || 0), 0);
    
    return {
      currentBalance,
      monthlyBudget,
      monthlySpent: spent,
      borrowed,
      lent
    };
  } catch (error) {
    logger.error(`Get money snapshot error: ${error.message}`);
    return {
      currentBalance: 0,
      monthlyBudget: 0,
      monthlySpent: 0,
      borrowed: 0,
      lent: 0
    };
  }
};

/**
 * Get currently watching item
 */
const getContinueWatching = async (userId) => {
  try {
    const watchItem = await WatchItem.findOne({
      userId,
      status: 'watching'
    })
      .sort({ lastWatchedAt: -1, updatedAt: -1 })
      .select('title type currentSeason currentEpisode platforms poster')
      .lean();
    
    if (!watchItem) {
      return null;
    }
    
    // Calculate progress percent for series
    // Note: Without total episodes data, we use a simple calculation
    // In a production app, you'd store total episodes per season
    let progressPercent = 0;
    if (watchItem.type === 'series' && watchItem.currentSeason && watchItem.currentEpisode) {
      // Simple progress: season and episode indicate progress
      // This is a placeholder - actual progress would require total episodes
      progressPercent = 50; // Default to 50% if we have progress data
    }
    
    // Handle poster: can be Cloudinary object or URL string
    let posterUrl = null;
    if (watchItem.poster) {
      if (typeof watchItem.poster === 'string') {
        posterUrl = watchItem.poster;
      } else if (watchItem.poster.url) {
        posterUrl = watchItem.poster.url;
      }
    }
    
    return {
      title: watchItem.title,
      type: watchItem.type,
      season: watchItem.currentSeason || null,
      episode: watchItem.currentEpisode || null,
      platform: watchItem.platforms && watchItem.platforms.length > 0 ? watchItem.platforms[0] : null,
      progressPercent: Math.round(progressPercent),
      poster: posterUrl
    };
  } catch (error) {
    logger.error(`Get continue watching error: ${error.message}`);
    return null;
  }
};

/**
 * Get recent activity from multiple sources
 */
const getRecentActivity = async (userId) => {
  try {
    const limit = 10; // Get more to have better selection
    
    // Get recent trips
    const trips = await Trip.find({
      userId,
      status: { $ne: 'cancelled' }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title createdAt')
      .lean();
    
    // Get recent diary entries
    const diaryEntries = await DiaryEntry.find({
      userId,
      isArchived: false
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title content createdAt')
      .lean();
    
    // Get recent ideas
    const ideas = await Idea.find({
      userId,
      status: { $ne: 'archived' }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title content type createdAt')
      .lean();
    
    // Get recent transactions
    const transactions = await Transaction.find({
      userId
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('amount type category note createdAt')
      .lean();
    
    // Combine and format activities
    const activities = [];
    
    // Add trips
    trips.forEach(trip => {
      activities.push({
        type: 'TRAVEL',
        message: `Added ${trip.title} Trip`,
        createdAt: trip.createdAt
      });
    });
    
    // Add diary entries
    diaryEntries.forEach(entry => {
      const title = entry.title || 'New diary entry';
      activities.push({
        type: 'DIARY',
        message: title,
        createdAt: entry.createdAt
      });
    });
    
    // Add ideas
    ideas.forEach(idea => {
      const title = idea.title || idea.content?.substring(0, 30) || 'New idea';
      activities.push({
        type: 'IDEA',
        message: `Saved idea: ${title}`,
        createdAt: idea.createdAt
      });
    });
    
    // Add transactions
    transactions.forEach(transaction => {
      const amount = transaction.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      const category = transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1);
      const action = transaction.type === 'expense' ? 'Logged' : 'Earned';
      activities.push({
        type: 'MONEY',
        message: `${action} ${amount} ${category} expense`,
        createdAt: transaction.createdAt
      });
    });
    
    // Sort by createdAt descending and limit to 5
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return activities.slice(0, 5);
  } catch (error) {
    logger.error(`Get recent activity error: ${error.message}`);
    return [];
  }
};

/**
 * Generate insight based on data
 */
const generateInsight = async (userId, moneySnapshot, nextSubscription) => {
  try {
    // Check for unused subscriptions (not opened in 25+ days)
    const now = new Date();
    const twentyFiveDaysAgo = new Date(now.getTime() - (25 * 24 * 60 * 60 * 1000));
    
    const unusedSubscription = await Subscription.findOne({
      userId,
      status: 'active',
      lastUsedAt: { $lt: twentyFiveDaysAgo }
    })
      .select('name lastUsedAt')
      .lean();
    
    if (unusedSubscription) {
      const daysSinceLastUse = Math.floor(
        (now - new Date(unusedSubscription.lastUsedAt)) / (1000 * 60 * 60 * 24)
      );
      return {
        message: `You haven't opened ${unusedSubscription.name} in ${daysSinceLastUse} days.`,
        cta: 'Reflect'
      };
    }
    
    // Check if monthly spent is high
    if (moneySnapshot.monthlyBudget > 0) {
      const spentPercentage = (moneySnapshot.monthlySpent / moneySnapshot.monthlyBudget) * 100;
      
      if (spentPercentage > 80) {
        return {
          message: `You've spent ${Math.round(spentPercentage)}% of your monthly budget. Consider reviewing your expenses.`,
          cta: 'View Money Management'
        };
      }
    }
    
    // Check for upcoming subscription renewal
    if (nextSubscription && nextSubscription.renewsInDays <= 7) {
      return {
        message: `${nextSubscription.name} renews in ${nextSubscription.renewsInDays} days. Review if you still need it.`,
        cta: 'Manage Subscriptions'
      };
    }
    
    // Check for low balance
    if (moneySnapshot.currentBalance < 1000 && moneySnapshot.monthlyBudget > 0) {
      return {
        message: 'Your savings are running low. Consider adding to your funds.',
        cta: 'View Funds'
      };
    }
    
    return null;
  } catch (error) {
    logger.error(`Generate insight error: ${error.message}`);
    return null;
  }
};

/**
 * Get dashboard data for user
 */
export const getDashboardData = async (userId) => {
  try {
    // Get user info
    const user = await User.findById(userId)
      .select('name')
      .lean();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Fetch all data in parallel
    const [
      nextTrip,
      nextSubscription,
      nextPayment,
      moneySnapshot,
      continueWatching,
      recentActivity
    ] = await Promise.all([
      getNextTrip(userId),
      getNextSubscription(userId),
      getNextPayment(userId),
      getMoneySnapshot(userId),
      getContinueWatching(userId),
      getRecentActivity(userId)
    ]);
    
    // Generate insight (needs userId for subscription check)
    const insight = await generateInsight(userId, moneySnapshot, nextSubscription);
    
    // Build response
    const dashboardData = {
      greeting: {
        message: buildGreetingMessage(user.name),
        date: new Date().toISOString().split('T')[0]
      },
      upcoming: {
        nextTrip,
        nextSubscription,
        nextPayment
      },
      moneySnapshot,
      continueWatching,
      recentActivity,
      quickCapture: {
        enabled: true
      },
      insight
    };
    
    return dashboardData;
  } catch (error) {
    logger.error(`Get dashboard data error: ${error.message}`);
    throw error;
  }
};
