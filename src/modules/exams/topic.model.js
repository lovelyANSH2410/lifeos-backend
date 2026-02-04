import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    study: { type: Boolean, default: false },
    rev1: { type: Boolean, default: false },
    rev2: { type: Boolean, default: false },
    rev3: { type: Boolean, default: false }
  },
  { timestamps: true }
);

topicSchema.index({ subjectId: 1, createdAt: -1 });

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
