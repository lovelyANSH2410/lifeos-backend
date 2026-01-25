import mongoose from 'mongoose';

const fundSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['emergency', 'savings', 'goal'],
      required: [true, 'Type is required'],
      index: true
    },
    targetAmount: {
      type: Number,
      min: [0, 'Target amount must be greater than or equal to 0']
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount must be greater than or equal to 0']
    },
    priority: {
      type: Number,
      min: [1, 'Priority must be between 1 and 5'],
      max: [5, 'Priority must be between 1 and 5'],
      default: 3
    },
    isLocked: {
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
fundSchema.index({ userId: 1, type: 1 });
fundSchema.index({ userId: 1, isLocked: 1 });
fundSchema.index({ userId: 1, priority: 1 });

// Ensure user can only access their own funds
fundSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const Fund = mongoose.model('Fund', fundSchema);

export default Fund;
