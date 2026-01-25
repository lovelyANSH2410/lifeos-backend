import mongoose from 'mongoose';

const fixedExpenseSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ['rent', 'utilities', 'internet', 'phone', 'insurance', 'emi', 'subscription', 'other'],
      required: [true, 'Category is required'],
      index: true
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: [true, 'Billing cycle is required'],
      default: 'monthly'
    },
    dueDate: {
      type: Number,
      min: [1, 'Due date must be between 1 and 31'],
      max: [31, 'Due date must be between 1 and 31']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
fixedExpenseSchema.index({ userId: 1, isActive: 1 });
fixedExpenseSchema.index({ userId: 1, category: 1 });
fixedExpenseSchema.index({ userId: 1, billingCycle: 1 });

// Ensure user can only access their own fixed expenses
fixedExpenseSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const FixedExpense = mongoose.model('FixedExpense', fixedExpenseSchema);

export default FixedExpense;
