import express from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Routes
router.get('/', dashboardController.getDashboard);

export default router;
