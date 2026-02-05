import mongoose from 'mongoose';

const studyEventLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyEvent',
      required: [true, 'Event ID is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    completed: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

studyEventLogSchema.index({ eventId: 1, date: 1 }, { unique: true });

const StudyEventLog = mongoose.model('StudyEventLog', studyEventLogSchema);

export default StudyEventLog;
