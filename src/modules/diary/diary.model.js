import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: [true, 'Public ID is required']
  },
  url: {
    type: String,
    required: [true, 'URL is required']
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  format: {
    type: String
  }
}, { _id: false });

const diaryEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    mood: {
      type: String,
      enum: ['calm', 'happy', 'energetic', 'sad', 'nostalgic', 'stressed', 'grateful', 'neutral'],
      default: 'neutral',
      index: true
    },
    images: {
      type: [imageSchema],
      default: []
    },
    entryDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
diaryEntrySchema.index({ userId: 1, entryDate: -1 });
diaryEntrySchema.index({ userId: 1, mood: 1 });
diaryEntrySchema.index({ userId: 1, isArchived: 1 });

// Ensure user can only access their own entries
diaryEntrySchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const DiaryEntry = mongoose.model('DiaryEntry', diaryEntrySchema);

export default DiaryEntry;
