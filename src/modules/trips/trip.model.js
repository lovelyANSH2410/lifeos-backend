import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  }
}, { _id: false });

const coverImageSchema = new mongoose.Schema({
  publicId: {
    type: String
  },
  url: {
    type: String
  }
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  estimated: {
    type: Number,
    min: [0, 'Budget must be greater than or equal to 0']
  },
  currency: {
    type: String,
    default: 'USD',
    trim: true
  }
}, { _id: false });

const tripSchema = new mongoose.Schema(
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
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    location: {
      type: locationSchema,
      required: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
      validate: {
        validator: function(value) {
          return value >= this.startDate;
        },
        message: 'End date must be after or equal to start date'
      }
    },
    coverImage: {
      type: coverImageSchema
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true
    },
    budget: {
      type: budgetSchema
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
      trim: true
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
tripSchema.index({ userId: 1, status: 1 });
tripSchema.index({ userId: 1, startDate: 1 });
tripSchema.index({ userId: 1, status: 1, startDate: 1 });

// Ensure user can only access their own trips
tripSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
