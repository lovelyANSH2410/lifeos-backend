import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    personName: {
      type: String,
      required: [true, 'Person name is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be greater than or equal to 0']
    },
    type: {
      type: String,
      enum: ['lent', 'borrowed'],
      required: [true, 'Type is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'settled'],
      default: 'pending',
      index: true
    },
    dueDate: {
      type: Date
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
debtSchema.index({ userId: 1, status: 1 });
debtSchema.index({ userId: 1, type: 1 });
debtSchema.index({ userId: 1, dueDate: 1 });

// Ensure user can only access their own debts
debtSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const Debt = mongoose.model('Debt', debtSchema);

export default Debt;
