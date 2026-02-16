import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    examDate: {
      type: Date
    }
  },
  { timestamps: true }
);

examSchema.index({ userId: 1, createdAt: -1 });

const Exam = mongoose.model('Exam', examSchema);

export default Exam;
