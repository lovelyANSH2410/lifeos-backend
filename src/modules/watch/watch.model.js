import mongoose from 'mongoose';

const posterSchema = new mongoose.Schema({
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

const watchItemSchema = new mongoose.Schema(
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
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['movie', 'series', 'documentary', 'anime', 'short'],
      required: [true, 'Type is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['planned', 'watching', 'watched', 'dropped'],
      default: 'planned',
      index: true
    },
    platforms: {
      type: [String],
      default: []
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
      validate: {
        validator: function(value) {
          // Rating is only allowed if status is 'watched'
          if (value !== undefined && value !== null) {
            return this.status === 'watched';
          }
          return true;
        },
        message: 'Rating can only be set when status is "watched"'
      }
    },
    moodTags: {
      type: [String],
      default: []
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      trim: true
    },
    poster: {
      type: mongoose.Schema.Types.Mixed,
      // Can be either:
      // 1. Cloudinary object: { publicId, url, width, height, format }
      // 2. Direct URL string: "https://example.com/poster.jpg"
      validate: {
        validator: function(value) {
          if (!value) return true; // Optional field
          // If it's a string, it should be a valid URL
          if (typeof value === 'string') {
            try {
              new URL(value);
              return true;
            } catch {
              return false;
            }
          }
          // If it's an object, it should have the posterSchema structure
          if (typeof value === 'object' && value !== null) {
            return value.publicId && value.url;
          }
          return false;
        },
        message: 'Poster must be either a valid URL string or a Cloudinary object with publicId and url'
      }
    },
    currentSeason: {
      type: Number,
      min: [1, 'Season must be at least 1'],
      validate: {
        validator: function(value) {
          // Season tracking only for series
          if (value !== undefined && value !== null) {
            return this.type === 'series';
          }
          return true;
        },
        message: 'Season tracking is only available for series'
      }
    },
    currentEpisode: {
      type: Number,
      min: [1, 'Episode must be at least 1'],
      validate: {
        validator: function(value) {
          // Episode tracking only for series
          if (value !== undefined && value !== null) {
            return this.type === 'series';
          }
          return true;
        },
        message: 'Episode tracking is only available for series'
      }
    },
    lastWatchedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
watchItemSchema.index({ userId: 1, status: 1 });
watchItemSchema.index({ userId: 1, type: 1 });
watchItemSchema.index({ userId: 1, isFavorite: 1 });
watchItemSchema.index({ userId: 1, createdAt: -1 });
watchItemSchema.index({ userId: 1, lastWatchedAt: -1 });
watchItemSchema.index({ userId: 1, status: 1, type: 1 });

// Ensure user can only access their own watch items
watchItemSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const WatchItem = mongoose.model('WatchItem', watchItemSchema);

export default WatchItem;
