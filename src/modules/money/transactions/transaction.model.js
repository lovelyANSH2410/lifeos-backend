import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be greater than or equal to 0']
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      required: [true, 'Type is required'],
      index: true
    },
    category: {
      type: String,
      enum: ['food', 'travel', 'shopping', 'entertainment', 'health', 'misc'],
      required: [true, 'Category is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    source: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });

// Ensure user can only access their own transactions
transactionSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
