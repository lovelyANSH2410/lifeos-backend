import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    profileImage: {
      type: mongoose.Schema.Types.Mixed,
      // Can be either:
      // 1. Cloudinary object: { publicId, url, width, height, format }
      // 2. Direct URL string: "https://example.com/avatar.jpg"
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
          // If it's an object, it should have Cloudinary structure
          if (typeof value === 'object' && value !== null) {
            return value.publicId && value.url;
          }
          return false;
        },
        message: 'Profile image must be either a valid URL string or a Cloudinary object with publicId and url'
      }
    },
    subscription: {
      plan: {
        type: String,
        enum: ['FREE', 'PRO', 'COUPLE', 'LIFETIME'],
        default: 'FREE'
      },
      billingCycle: {
        type: String,
        enum: ['NONE', 'MONTHLY', 'YEARLY'],
        default: 'NONE'
      },
      price: {
        type: Number,
        default: 0
      },
      startedAt: {
        type: Date,
        default: null
      },
      expiresAt: {
        type: Date,
        default: null
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

// Method to check if subscription is active
userSchema.methods.isSubscriptionActive = function () {
  if (!this.subscription) return true; // Default to active if no subscription data
  if (this.subscription.plan === 'FREE') return true;
  if (this.subscription.plan === 'LIFETIME') return true;
  if (!this.subscription.expiresAt) return false;
  return this.subscription.expiresAt > new Date();
};

const User = mongoose.model('User', userSchema);

export default User;
