import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: [true, 'Public ID is required']
  },
  url: {
    type: String,
    required: [true, 'URL is required']
  },
  format: {
    type: String
  },
  size: {
    type: Number // Size in bytes
  }
}, { _id: false });

const vaultDocumentSchema = new mongoose.Schema(
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
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    category: {
      type: String,
      enum: ['identity', 'insurance', 'finance', 'medical', 'property', 'education', 'other'],
      default: 'other',
      index: true
    },
    file: {
      type: fileSchema,
      required: [true, 'File is required']
    },
    issuedDate: {
      type: Date
    },
    expiryDate: {
      type: Date,
      index: true
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      trim: true
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
vaultDocumentSchema.index({ userId: 1, category: 1 });
vaultDocumentSchema.index({ userId: 1, isArchived: 1 });
vaultDocumentSchema.index({ userId: 1, expiryDate: 1 });
vaultDocumentSchema.index({ userId: 1, createdAt: -1 });

// Ensure user can only access their own documents
vaultDocumentSchema.methods.isOwner = function (userId) {
  return this.userId.toString() === userId.toString();
};

const VaultDocument = mongoose.model('VaultDocument', vaultDocumentSchema);

export default VaultDocument;
