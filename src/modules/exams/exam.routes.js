import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as examController from './exam.controller.js';

const examRouter = express.Router();
const subjectRouter = express.Router();
const topicRouter = express.Router();

examRouter.use(authenticate);
subjectRouter.use(authenticate);
topicRouter.use(authenticate);

examRouter.post('/', examController.createExam);
examRouter.get('/', examController.getExams);
examRouter.get('/:examId', examController.getExamById);
examRouter.put('/:examId', examController.updateExam);
examRouter.delete('/:examId', examController.deleteExam);
examRouter.post('/:examId/subjects', examController.createSubject);
examRouter.get('/:examId/subjects', examController.getSubjects);

subjectRouter.put('/:subjectId', examController.updateSubject);
subjectRouter.delete('/:subjectId', examController.deleteSubject);
subjectRouter.post('/:subjectId/topics', examController.createTopic);
subjectRouter.get('/:subjectId/topics', examController.getTopics);

topicRouter.put('/:topicId/progress', examController.updateTopicProgress);
topicRouter.put('/:topicId', examController.updateTopic);
topicRouter.delete('/:topicId', examController.deleteTopic);

export { examRouter, subjectRouter, topicRouter };
