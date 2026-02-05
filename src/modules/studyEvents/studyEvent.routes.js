import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as studyEventController from './studyEvent.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', studyEventController.createStudyEvent);
router.get('/', studyEventController.getStudyEvents);
router.get('/today', studyEventController.getTodayStudyEvents);
router.post('/:eventId/complete', studyEventController.completeStudyEvent);

export default router;
