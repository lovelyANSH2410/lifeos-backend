import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be greater than or equal to 0']
    },
    type: {
      type: String,
      enum: ['salary', 'freelance', 'bonus', 'side_income', 'refund', 'other'],
      required: [true, 'Type is required'],
      index: true
    },
    frequency: {
      type: String,
      enum: ['monthly', 'one_time'],
      required: [true, 'Frequency is required'],
      default: 'monthly'
    },
    receivedAt: {
      type: Date,
      required: [true, 'Received date is required'],
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
incomeSchema.index({ userId: 1, receivedAt: -1 });
incomeSchema.index({ userId: 1, type: 1 });
incomeSchema.index({ userId: 1, frequency: 1 });

// Ensure user can only access their own income
incomeSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const Income = mongoose.model('Income', incomeSchema);

export default Income;
