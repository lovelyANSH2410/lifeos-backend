import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  publicId: {
    type: String
  },
  url: {
    type: String
  }
}, { _id: false });

const ideaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    title: {
      type: String,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
      trim: true
    },
    type: {
      type: String,
      enum: ['curiosity', 'learning', 'idea', 'inspiration', 'news', 'question', 'random'],
      index: true
    },
    source: {
      type: String,
      enum: ['youtube', 'instagram', 'article', 'book', 'conversation', 'random'],
      index: true
    },
    link: {
      type: String,
      trim: true
    },
    image: {
      type: imageSchema
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    status: {
      type: String,
      enum: ['inbox', 'saved', 'explored', 'archived'],
      default: 'inbox',
      index: true
    },
    revisitAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
ideaSchema.index({ userId: 1, status: 1 });
ideaSchema.index({ userId: 1, type: 1 });
ideaSchema.index({ userId: 1, source: 1 });
ideaSchema.index({ userId: 1, createdAt: -1 });
ideaSchema.index({ userId: 1, status: 1, createdAt: 1 });

// Ensure user can only access their own ideas
ideaSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const Idea = mongoose.model('Idea', ideaSchema);

export default Idea;
