import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Subscription name is required'],
      trim: true
    },
    provider: {
      type: String,
      trim: true
    },
    icon: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be greater than or equal to 0']
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    renewalDate: {
      type: Date,
      required: [true, 'Renewal date is required'],
      index: true
    },
    lastUsedAt: {
      type: Date
    },
    category: {
      type: String,
      enum: ['entertainment', 'productivity', 'cloud', 'utilities', 'education', 'other'],
      default: 'other',
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled'],
      default: 'active',
      index: true
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      trim: true
    },
    isAutoRenew: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, renewalDate: 1 });
subscriptionSchema.index({ userId: 1, category: 1 });
subscriptionSchema.index({ userId: 1, status: 1, renewalDate: 1 });

// Ensure user can only access their own subscriptions
subscriptionSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
