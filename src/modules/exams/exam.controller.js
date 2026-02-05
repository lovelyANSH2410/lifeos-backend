import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as examService from './exam.service.js';
import * as progressService from './progress.service.js';
import logger from '../../utils/logger.util.js';

export const createExam = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, examDate } = req.body;
    if (!name || !name.trim()) {
      return sendValidationError(res, [{ field: 'name', message: 'Name is required' }]);
    }
    const exam = await examService.createExam(userId, { name: name.trim(), examDate });
    const data = exam.toObject ? exam.toObject() : exam;
    return sendSuccess(res, { ...data, progress: 0 }, 'Exam created', HTTP_STATUS.CREATED);
  } catch (error) {
    logger.error(`Create exam: ${error.message}`);
    next(error);
  }
};

export const getExams = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const exams = await examService.getExams(userId);
    if (exams.length === 0) {
      return sendSuccess(res, progressService.addExamProgress(exams, {}), 'Exams retrieved');
    }
    const examIds = exams.map((e) => e._id);
    const allSubjects = await examService.getSubjectsByExamIds(examIds);
    const subjectIds = allSubjects.map((s) => s._id);
    const topicsBySubject = subjectIds.length
      ? await examService.getTopicsGroupedBySubject(subjectIds)
      : {};
    const subjectProgressByExam = await examService.getSubjectProgressGroupedByExam(
      examIds,
      topicsBySubject
    );
    const withProgress = progressService.addExamProgress(exams, subjectProgressByExam);
    return sendSuccess(res, withProgress, 'Exams retrieved');
  } catch (error) {
    logger.error(`Get exams: ${error.message}`);
    next(error);
  }
};

export const getExamById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { examId } = req.params;
    const exam = await examService.getExamById(examId, userId);
    const subjects = await examService.getSubjectsByExamId(examId, userId);
    const subjectIds = subjects.map((s) => s._id);
    const topicsBySubject = await examService.getTopicsGroupedBySubject(subjectIds);
    const subjectProgressByExam = await examService.getSubjectProgressGroupedByExam(
      [exam._id],
      topicsBySubject
    );
    const progress = subjectProgressByExam[exam._id.toString()]
      ? progressService.getExamProgress(subjectProgressByExam[exam._id.toString()])
      : 0;
    return sendSuccess(res, { ...exam, progress }, 'Exam retrieved');
  } catch (error) {
    logger.error(`Get exam: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const updateExam = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { examId } = req.params;
    const { name, examDate } = req.body;
    const exam = await examService.updateExam(examId, userId, {
      name: name?.trim(),
      examDate
    });
    const data = exam.toObject ? exam.toObject() : exam;
    const subjects = await examService.getSubjectsByExamId(examId, userId);
    const subjectIds = subjects.map((s) => s._id);
    const topicsBySubject = subjectIds.length
      ? await examService.getTopicsGroupedBySubject(subjectIds)
      : {};
    const subjectProgressByExam = await examService.getSubjectProgressGroupedByExam(
      [exam._id],
      topicsBySubject
    );
    const progress = subjectProgressByExam[exam._id.toString()]
      ? progressService.getExamProgress(subjectProgressByExam[exam._id.toString()])
      : 0;
    return sendSuccess(res, { ...data, progress }, 'Exam updated');
  } catch (error) {
    logger.error(`Update exam: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const deleteExam = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { examId } = req.params;
    await examService.deleteExam(examId, userId);
    return sendSuccess(res, null, 'Exam deleted');
  } catch (error) {
    logger.error(`Delete exam: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { examId } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return sendValidationError(res, [{ field: 'name', message: 'Name is required' }]);
    }
    const subject = await examService.createSubject(examId, userId, { name: name.trim() });
    return sendSuccess(res, { ...subject.toObject(), progress: 0 }, 'Subject created', HTTP_STATUS.CREATED);
  } catch (error) {
    logger.error(`Create subject: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const getSubjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { examId } = req.params;
    const subjects = await examService.getSubjectsByExamId(examId, userId);
    const subjectIds = subjects.map((s) => s._id);
    const topicsBySubject = await examService.getTopicsGroupedBySubject(subjectIds);
    const withProgress = progressService.addSubjectProgress(subjects, topicsBySubject);
    return sendSuccess(res, withProgress, 'Subjects retrieved');
  } catch (error) {
    logger.error(`Get subjects: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return sendValidationError(res, [{ field: 'name', message: 'Name is required' }]);
    }
    const subject = await examService.updateSubject(subjectId, userId, { name: name.trim() });
    const topics = await examService.getTopicsBySubjectId(subjectId, userId);
    const progress = progressService.getSubjectProgress(topics);
    return sendSuccess(res, { ...subject.toObject(), progress }, 'Subject updated');
  } catch (error) {
    logger.error(`Update subject: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.params;
    await examService.deleteSubject(subjectId, userId);
    return sendSuccess(res, null, 'Subject deleted');
  } catch (error) {
    logger.error(`Delete subject: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const createTopic = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return sendValidationError(res, [{ field: 'name', message: 'Name is required' }]);
    }
    const topic = await examService.createTopic(subjectId, userId, { name: name.trim() });
    const withProgress = { ...topic.toObject(), progress: 0 };
    return sendSuccess(res, withProgress, 'Topic created', HTTP_STATUS.CREATED);
  } catch (error) {
    logger.error(`Create topic: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const getTopics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.params;
    const topics = await examService.getTopicsBySubjectId(subjectId, userId);
    const withProgress = progressService.addTopicProgress(topics);
    return sendSuccess(res, withProgress, 'Topics retrieved');
  } catch (error) {
    logger.error(`Get topics: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const updateTopicProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { topicId } = req.params;
    const { study, rev1, rev2, rev3 } = req.body;
    const updates = {};
    if (study !== undefined) updates.study = study;
    if (rev1 !== undefined) updates.rev1 = rev1;
    if (rev2 !== undefined) updates.rev2 = rev2;
    if (rev3 !== undefined) updates.rev3 = rev3;
    const topic = await examService.updateTopicProgress(topicId, userId, updates);
    const withProgress = {
      ...topic.toObject(),
      progress: progressService.getTopicProgress(topic)
    };
    return sendSuccess(res, withProgress, 'Topic progress updated');
  } catch (error) {
    logger.error(`Update topic progress: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const updateTopic = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { topicId } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return sendValidationError(res, [{ field: 'name', message: 'Name is required' }]);
    }
    const topic = await examService.updateTopic(topicId, userId, { name: name.trim() });
    const withProgress = {
      ...topic.toObject(),
      progress: progressService.getTopicProgress(topic)
    };
    return sendSuccess(res, withProgress, 'Topic updated');
  } catch (error) {
    logger.error(`Update topic: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

export const deleteTopic = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { topicId } = req.params;
    await examService.deleteTopic(topicId, userId);
    return sendSuccess(res, null, 'Topic deleted');
  } catch (error) {
    logger.error(`Delete topic: ${error.message}`);
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
