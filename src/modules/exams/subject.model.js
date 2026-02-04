import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    }
  },
  { timestamps: true }
);

subjectSchema.index({ examId: 1, createdAt: -1 });

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
