import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  }
}, { _id: false });

const priceSchema = new mongoose.Schema({
  amount: {
    type: Number,
    min: [0, 'Amount must be greater than or equal to 0']
  },
  currency: {
    type: String,
    trim: true,
    uppercase: true
  }
}, { _id: false });

const imageSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
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

const giftIdeaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true
    },
    type: {
      type: String,
      enum: ['cafe', 'stay', 'gift', 'activity', 'experience', 'other'],
      required: [true, 'Type is required'],
      index: true
    },
    location: {
      type: locationSchema
    },
    price: {
      type: priceSchema
    },
    link: {
      type: String,
      trim: true
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: function(images) {
          return images.length <= 3;
        },
        message: 'Maximum 3 images allowed'
      }
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags) {
          return tags.length <= 5;
        },
        message: 'Maximum 5 tags allowed'
      }
    },
    status: {
      type: String,
      enum: ['idea', 'planned', 'used', 'archived'],
      default: 'idea',
      index: true
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true
    },
    source: {
      type: String,
      trim: true,
      maxlength: [200, 'Source cannot exceed 200 characters']
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
giftIdeaSchema.index({ userId: 1, type: 1 });
giftIdeaSchema.index({ userId: 1, status: 1 });
giftIdeaSchema.index({ userId: 1, isFavorite: 1 });
giftIdeaSchema.index({ userId: 1, createdAt: -1 });
giftIdeaSchema.index({ userId: 1, status: 1, type: 1 });

// Ensure user can only access their own gift ideas
giftIdeaSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const GiftIdea = mongoose.model('GiftIdea', giftIdeaSchema);

export default GiftIdea;
