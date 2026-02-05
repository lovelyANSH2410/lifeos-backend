import Exam from './exam.model.js';
import Subject from './subject.model.js';
import Topic from './topic.model.js';
import { getSubjectProgress } from './progress.service.js';
import { MESSAGES } from '../../config/constants.js';

export const createExam = async (userId, { name, examDate }) => {
  const exam = await Exam.create({
    userId,
    name,
    examDate: examDate ? new Date(examDate) : undefined
  });
  return exam;
};

export const getExams = async (userId) => {
  return Exam.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const getExamById = async (examId, userId) => {
  const exam = await Exam.findOne({ _id: examId, userId }).lean();
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  return exam;
};

export const updateExam = async (examId, userId, { name, examDate }) => {
  const exam = await Exam.findOne({ _id: examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  if (name !== undefined) exam.name = name.trim();
  if (examDate !== undefined) exam.examDate = examDate ? new Date(examDate) : null;
  await exam.save();
  return exam;
};

export const deleteExam = async (examId, userId) => {
  const exam = await Exam.findOne({ _id: examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  const subjects = await Subject.find({ examId }).lean();
  const subjectIds = subjects.map((s) => s._id);
  await Topic.deleteMany({ subjectId: { $in: subjectIds } });
  await Subject.deleteMany({ examId });
  await Exam.findByIdAndDelete(examId);
  return { deleted: true };
};

export const createSubject = async (examId, userId, { name }) => {
  const exam = await Exam.findOne({ _id: examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  const subject = await Subject.create({ examId, name });
  return subject;
};

export const getSubjectsByExamId = async (examId, userId) => {
  const exam = await Exam.findOne({ _id: examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  return Subject.find({ examId }).sort({ createdAt: 1 }).lean();
};

export const getSubjectsByExamIds = async (examIds) => {
  return Subject.find({ examId: { $in: examIds } }).sort({ createdAt: 1 }).lean();
};

export const updateSubject = async (subjectId, userId, { name }) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new Error(MESSAGES.NOT_FOUND);
  const exam = await Exam.findOne({ _id: subject.examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  if (name !== undefined) subject.name = name.trim();
  await subject.save();
  return subject;
};

export const deleteSubject = async (subjectId, userId) => {
  const subject = await Subject.findById(subjectId).lean();
  if (!subject) throw new Error(MESSAGES.NOT_FOUND);
  const exam = await Exam.findOne({ _id: subject.examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  await Topic.deleteMany({ subjectId });
  await Subject.findByIdAndDelete(subjectId);
  return { deleted: true };
};

export const createTopic = async (subjectId, userId, { name }) => {
  const subject = await Subject.findById(subjectId).lean();
  if (!subject) throw new Error(MESSAGES.NOT_FOUND);
  const exam = await Exam.findOne({ _id: subject.examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  const topic = await Topic.create({ subjectId, name });
  return topic;
};

export const getTopicsBySubjectId = async (subjectId, userId) => {
  const subject = await Subject.findById(subjectId).lean();
  if (!subject) throw new Error(MESSAGES.NOT_FOUND);
  const exam = await Exam.findOne({ _id: subject.examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  return Topic.find({ subjectId }).sort({ createdAt: 1 }).lean();
};

const ALLOWED_PROGRESS_FIELDS = ['study', 'rev1', 'rev2', 'rev3'];

export const updateTopicProgress = async (topicId, userId, updates) => {
  const topic = await Topic.findById(topicId);
  if (!topic) throw new Error(MESSAGES.NOT_FOUND);
  const subject = await Subject.findById(topic.subjectId).lean();
  if (!subject) throw new Error(MESSAGES.NOT_FOUND);
  const exam = await Exam.findOne({ _id: subject.examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);

  for (const key of ALLOWED_PROGRESS_FIELDS) {
    if (updates[key] !== undefined) {
      topic[key] = Boolean(updates[key]);
    }
  }
  await topic.save();
  return topic;
};

export const updateTopic = async (topicId, userId, { name }) => {
  const topic = await Topic.findById(topicId);
  if (!topic) throw new Error(MESSAGES.NOT_FOUND);
  const subject = await Subject.findById(topic.subjectId).lean();
  if (!subject) throw new Error(MESSAGES.NOT_FOUND);
  const exam = await Exam.findOne({ _id: subject.examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  if (name !== undefined) topic.name = name.trim();
  await topic.save();
  return topic;
};

export const deleteTopic = async (topicId, userId) => {
  const topic = await Topic.findById(topicId).lean();
  if (!topic) throw new Error(MESSAGES.NOT_FOUND);
  const subject = await Subject.findById(topic.subjectId).lean();
  if (!subject) throw new Error(MESSAGES.NOT_FOUND);
  const exam = await Exam.findOne({ _id: subject.examId, userId });
  if (!exam) throw new Error(MESSAGES.NOT_FOUND);
  await Topic.findByIdAndDelete(topicId);
  return { deleted: true };
};

export const getTopicsGroupedBySubject = async (subjectIds) => {
  const topics = await Topic.find({ subjectId: { $in: subjectIds } }).lean();
  const bySubject = {};
  for (const t of topics) {
    const sid = t.subjectId.toString();
    if (!bySubject[sid]) bySubject[sid] = [];
    bySubject[sid].push(t);
  }
  return bySubject;
};

export const getSubjectProgressGroupedByExam = async (examIds, topicsBySubjectId) => {
  const subjects = await Subject.find({ examId: { $in: examIds } }).lean();
  const byExam = {};
  for (const s of subjects) {
    const eid = s.examId.toString();
    const topics = topicsBySubjectId[s._id.toString()] || [];
    const progress = getSubjectProgress(topics);
    if (!byExam[eid]) byExam[eid] = [];
    byExam[eid].push(progress);
  }
  return byExam;
};
