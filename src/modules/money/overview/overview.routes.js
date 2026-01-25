import express from 'express';
import * as overviewController from './overview.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', overviewController.getMonthlyOverview);

export default router;
