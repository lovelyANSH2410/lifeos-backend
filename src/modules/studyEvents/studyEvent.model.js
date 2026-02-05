import mongoose from 'mongoose';

const recurrenceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily'
  },
  daysOfWeek: {
    type: [Number],
    default: [],
    validate: {
      validator: function(days) {
        return days.every(day => day >= 0 && day <= 6);
      },
      message: 'Days of week must be between 0 (Sunday) and 6 (Saturday)'
    }
  }
}, { _id: false });

const studyEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    date: {
      type: Date
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrence: {
      type: recurrenceSchema,
      default: () => ({ type: 'daily', daysOfWeek: [] })
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam'
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic'
    }
  },
  { timestamps: true }
);

studyEventSchema.index({ userId: 1, date: 1 });
studyEventSchema.index({ userId: 1, isRecurring: 1 });

const StudyEvent = mongoose.model('StudyEvent', studyEventSchema);

export default StudyEvent;
