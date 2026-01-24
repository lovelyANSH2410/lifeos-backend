import mongoose from 'mongoose';

const encryptedPasswordSchema = new mongoose.Schema({
  iv: {
    type: String,
    required: [true, 'IV is required']
  },
  content: {
    type: String,
    required: [true, 'Encrypted content is required']
  },
  tag: {
    type: String,
    required: [true, 'Auth tag is required']
  }
}, { _id: false });

const vaultItemSchema = new mongoose.Schema(
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
    username: {
      type: String,
      trim: true,
      maxlength: [500, 'Username cannot exceed 500 characters']
    },
    encryptedPassword: {
      type: encryptedPasswordSchema,
      required: [true, 'Encrypted password is required']
    },
    category: {
      type: String,
      enum: ['credentials', 'bank', 'utility', 'other'],
      default: 'credentials',
      index: true
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
vaultItemSchema.index({ userId: 1, category: 1 });
vaultItemSchema.index({ userId: 1, createdAt: -1 });

// Ensure user can only access their own vault items
vaultItemSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const VaultItem = mongoose.model('VaultItem', vaultItemSchema);

export default VaultItem;
