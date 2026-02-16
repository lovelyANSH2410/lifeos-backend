import StudyEvent from './studyEvent.model.js';
import StudyEventLog from './studyEventLog.model.js';
import { MESSAGES } from '../../config/constants.js';

export const createStudyEvent = async (userId, data) => {
  const eventData = {
    userId,
    title: data.title.trim(),
    date: data.date ? new Date(data.date) : undefined,
    isRecurring: data.isRecurring || false,
    recurrence: data.recurrence || { type: 'daily', daysOfWeek: [] },
    examId: data.examId || undefined,
    subjectId: data.subjectId || undefined,
    topicId: data.topicId || undefined
  };
  return StudyEvent.create(eventData);
};

const getDayOfWeek = (date) => {
  return date.getDay();
};

const matchesRecurrence = (event, targetDate) => {
  if (!event.isRecurring) return false;
  
  const targetDay = getDayOfWeek(targetDate);
  const { type, daysOfWeek } = event.recurrence || {};

  if (type === 'daily') {
    return true;
  }
  if (type === 'weekly') {
    return daysOfWeek.includes(targetDay);
  }
  if (type === 'custom') {
    return daysOfWeek.includes(targetDay);
  }
  return false;
};

export const getStudyEventsForMonth = async (userId, monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const oneTimeEvents = await StudyEvent.find({
    userId,
    isRecurring: false,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 }).lean();

  const recurringEvents = await StudyEvent.find({
    userId,
    isRecurring: true
  }).lean();

  const eventInstances = [];
  
  for (const event of oneTimeEvents) {
    eventInstances.push({
      ...event,
      instanceDate: event.date ? new Date(event.date) : null
    });
  }
  
  for (const recurring of recurringEvents) {
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (matchesRecurrence(recurring, currentDate)) {
        eventInstances.push({
          ...recurring,
          instanceDate: new Date(currentDate)
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  eventInstances.sort((a, b) => {
    const dateA = a.instanceDate ? a.instanceDate.getTime() : 0;
    const dateB = b.instanceDate ? b.instanceDate.getTime() : 0;
    return dateA - dateB;
  });

  const eventIds = [...new Set(eventInstances.map(e => e._id.toString()))];
  const logs = await StudyEventLog.find({
    eventId: { $in: eventIds },
    date: { $gte: startDate, $lte: endDate }
  }).lean();

  const logsByEventAndDate = {};
  for (const log of logs) {
    const dateStr = log.date.toISOString().split('T')[0];
    const key = `${log.eventId.toString()}_${dateStr}`;
    logsByEventAndDate[key] = log.completed;
  }

  return eventInstances.map(instance => {
    const dateStr = instance.instanceDate ? instance.instanceDate.toISOString().split('T')[0] : null;
    const key = dateStr ? `${instance._id.toString()}_${dateStr}` : null;
    const completed = key ? logsByEventAndDate[key] || false : false;
    return {
      ...instance,
      date: instance.instanceDate,
      completed
    };
  });
};

export const getTodayStudyEvents = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const oneTimeEvents = await StudyEvent.find({
    userId,
    isRecurring: false,
    date: { $gte: today, $lte: todayEnd }
  }).lean();

  const recurringEvents = await StudyEvent.find({
    userId,
    isRecurring: true
  }).lean();

  const todayEvents = [...oneTimeEvents];

  for (const recurring of recurringEvents) {
    if (matchesRecurrence(recurring, today)) {
      todayEvents.push({
        ...recurring,
        date: new Date(today)
      });
    }
  }

  const eventIds = todayEvents.map(e => e._id.toString());
  const logs = await StudyEventLog.find({
    eventId: { $in: eventIds },
    date: { $gte: today, $lte: todayEnd }
  }).lean();

  const completedMap = {};
  for (const log of logs) {
    completedMap[log.eventId.toString()] = log.completed;
  }

  return todayEvents.map(event => ({
    ...event,
    completed: completedMap[event._id.toString()] || false
  }));
};

export const completeStudyEvent = async (eventId, userId, date) => {
  const event = await StudyEvent.findOne({ _id: eventId, userId });
  if (!event) throw new Error(MESSAGES.NOT_FOUND);

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const existingLog = await StudyEventLog.findOne({
    eventId,
    date: {
      $gte: new Date(targetDate),
      $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  if (existingLog) {
    existingLog.completed = true;
    await existingLog.save();
    return existingLog;
  }

  return StudyEventLog.create({
    eventId,
    date: targetDate,
    completed: true
  });
};
