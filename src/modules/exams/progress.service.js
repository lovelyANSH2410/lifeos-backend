const TOPIC_STEPS = 4;

export const getTopicProgress = (topic) => {
  const completed = [topic.study, topic.rev1, topic.rev2, topic.rev3].filter(Boolean).length;
  return Math.round((completed / TOPIC_STEPS) * 100);
};

export const getSubjectProgress = (topics) => {
  if (!topics?.length) return 0;
  const sum = topics.reduce((acc, t) => acc + getTopicProgress(t), 0);
  return Math.round(sum / topics.length);
};

export const getExamProgress = (subjectProgressValues) => {
  if (!subjectProgressValues?.length) return 0;
  const sum = subjectProgressValues.reduce((acc, p) => acc + p, 0);
  return Math.round(sum / subjectProgressValues.length);
};

export const addTopicProgress = (topics) => {
  return topics.map((t) => ({
    ...(t.toObject ? t.toObject() : t),
    progress: getTopicProgress(t)
  }));
};

export const addSubjectProgress = (subjects, topicsBySubjectId) => {
  return subjects.map((s) => {
    const sid = s._id.toString();
    const topics = topicsBySubjectId[sid] || [];
    return {
      ...(s.toObject ? s.toObject() : s),
      progress: getSubjectProgress(topics)
    };
  });
};

export const addExamProgress = (exams, subjectProgressByExamId) => {
  return exams.map((e) => {
    const eid = e._id.toString();
    const subjectProgresses = subjectProgressByExamId[eid] || [];
    return {
      ...(e.toObject ? e.toObject() : e),
      progress: getExamProgress(subjectProgresses)
    };
  });
};
