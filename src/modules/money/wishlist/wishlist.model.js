import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema(
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
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be greater than or equal to 0']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'bought', 'removed'],
      default: 'pending',
      index: true
    },
    plannedMonth: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          // Validate YYYY-MM format
          return /^\d{4}-\d{2}$/.test(v);
        },
        message: 'Planned month must be in YYYY-MM format'
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
wishlistItemSchema.index({ userId: 1, status: 1 });
wishlistItemSchema.index({ userId: 1, priority: 1 });
wishlistItemSchema.index({ userId: 1, plannedMonth: 1 });

// Ensure user can only access their own wishlist items
wishlistItemSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const WishlistItem = mongoose.model('WishlistItem', wishlistItemSchema);

export default WishlistItem;
