import { sendSuccess } from '../../utils/response.util.js';
import { MESSAGES } from '../../config/constants.js';
import * as dashboardService from './dashboard.service.js';

/**
 * Get dashboard data
 */
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dashboardData = await dashboardService.getDashboardData(userId);
    
    return sendSuccess(res, dashboardData, 'Dashboard data retrieved successfully');
  } catch (error) {
    next(error);
  }
};
