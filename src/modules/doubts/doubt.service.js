import Doubt from './doubt.model.js';
import Exam from '../exams/exam.model.js';
import Subject from '../exams/subject.model.js';
import Topic from '../exams/topic.model.js';
import { uploadImage } from '../../utils/cloudinary.util.js';
import { MESSAGES } from '../../config/constants.js';
import logger from '../../utils/logger.util.js';

/**
 * Ensure subject (and optional topic) belong to the authenticated user via exam
 * Returns { exam, subject, topic? }
 */
const getExamAndSubjectContext = async (subjectId, userId, topicId) => {
  const subject = await Subject.findById(subjectId).lean();
  if (!subject) {
    throw new Error(MESSAGES.NOT_FOUND);
  }

  const exam = await Exam.findOne({ _id: subject.examId, userId }).lean();
  if (!exam) {
    throw new Error(MESSAGES.NOT_FOUND);
  }

  let topic = null;
  if (topicId) {
    topic = await Topic.findOne({ _id: topicId, subjectId }).lean();
    if (!topic) {
      throw new Error(MESSAGES.NOT_FOUND);
    }
  }

  return { exam, subject, topic };
};

export const createDoubt = async (userId, subjectId, payload, files = []) => {
  try {
    const { exam } = await getExamAndSubjectContext(subjectId, userId, payload.topicId);

    const images = Array.isArray(payload.images) ? [...payload.images] : [];

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const imageData = await uploadImage(file, 'lifeos/doubts');
          images.push(imageData);
        } catch (error) {
          logger.error(`Failed to upload doubt image: ${error.message}`);
        }
      }
    }

    const doubt = await Doubt.create({
      userId,
      examId: exam._id,
      subjectId,
      topicId: payload.topicId || undefined,
      title: payload.title.trim(),
      description: payload.description?.trim(),
      images,
      priority: payload.priority || 'medium'
    });

    return doubt;
  } catch (error) {
    logger.error(`Create doubt error: ${error.message}`);
    throw error;
  }
};

export const getDoubtsBySubject = async (userId, subjectId, filters = {}) => {
  try {
    // Ensure subject & exam belong to user
    await getExamAndSubjectContext(subjectId, userId);

    const query = {
      userId,
      subjectId
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    const doubts = await Doubt.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return doubts;
  } catch (error) {
    logger.error(`Get doubts by subject error: ${error.message}`);
    throw error;
  }
};

export const getDoubtById = async (id, userId) => {
  try {
    const doubt = await Doubt.findOne({
      _id: id,
      userId
    }).lean();

    if (!doubt) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return doubt;
  } catch (error) {
    logger.error(`Get doubt by id error: ${error.message}`);
    throw error;
  }
};

export const updateDoubt = async (id, userId, updates, files = []) => {
  try {
    const doubt = await Doubt.findOne({
      _id: id,
      userId
    });

    if (!doubt) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    if (updates.title !== undefined) {
      doubt.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      doubt.description = updates.description.trim();
    }

    if (updates.priority !== undefined) {
      doubt.priority = updates.priority;
    }

    if (updates.topicId !== undefined) {
      // When changing topic, we must ensure it belongs to same subject/exam/user
      if (updates.topicId === null) {
        doubt.topicId = undefined;
      } else {
        const topic = await Topic.findOne({
          _id: updates.topicId,
          subjectId: doubt.subjectId
        }).lean();
        if (!topic) {
          throw new Error(MESSAGES.NOT_FOUND);
        }
        doubt.topicId = updates.topicId;
      }
    }

    let images = doubt.images || [];
    if (updates.images !== undefined) {
      images = Array.isArray(updates.images) ? [...updates.images] : [];
    }

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const imageData = await uploadImage(file, 'lifeos/doubts');
          images.push(imageData);
        } catch (error) {
          logger.error(`Failed to upload doubt image: ${error.message}`);
        }
      }
    }

    doubt.images = images;

    await doubt.save();
    return doubt;
  } catch (error) {
    logger.error(`Update doubt error: ${error.message}`);
    throw error;
  }
};

export const resolveDoubt = async (id, userId, resolutionNote) => {
  try {
    const doubt = await Doubt.findOne({
      _id: id,
      userId
    });

    if (!doubt) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    doubt.status = 'resolved';
    doubt.resolvedAt = new Date();
    if (resolutionNote !== undefined) {
      doubt.resolutionNote = resolutionNote.trim();
    }

    await doubt.save();
    return doubt;
  } catch (error) {
    logger.error(`Resolve doubt error: ${error.message}`);
    throw error;
  }
};

export const deleteDoubt = async (id, userId) => {
  try {
    const doubt = await Doubt.findOneAndDelete({
      _id: id,
      userId
    });

    if (!doubt) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    return doubt;
  } catch (error) {
    logger.error(`Delete doubt error: ${error.message}`);
    throw error;
  }
};

