import VaultDocument from './vaultDocument.model.js';
import { uploadDocument, deleteDocument, generateSignedUrl } from '../../utils/cloudinary.util.js';
import logger from '../../utils/logger.util.js';
import { MESSAGES } from '../../config/constants.js';

/**
 * Create a new vault document
 */
export const createVaultDocument = async (userId, documentData, fileBuffer, originalName) => {
  try {
    // Upload document to Cloudinary
    const fileData = await uploadDocument(fileBuffer, originalName);

    // Create vault document
    const vaultDocument = await VaultDocument.create({
      userId,
      title: documentData.title.trim(),
      category: documentData.category || 'other',
      file: {
        publicId: fileData.publicId,
        url: fileData.url,
        format: fileData.format,
        size: fileData.size
      },
      issuedDate: documentData.issuedDate ? new Date(documentData.issuedDate) : undefined,
      expiryDate: documentData.expiryDate ? new Date(documentData.expiryDate) : undefined,
      notes: documentData.notes?.trim(),
      isArchived: false
    });

    // Return document without exposing full Cloudinary URL
    const docObj = vaultDocument.toObject();
    // Keep basic file info but don't expose full URL in list view
    return docObj;
  } catch (error) {
    logger.error(`Create vault document error: ${error.message}`);
    throw error;
  }
};

/**
 * Get vault documents for a user with filters
 */
export const getVaultDocuments = async (userId, filters = {}) => {
  try {
    const {
      category,
      expiringSoon,
      isArchived
    } = filters;

    // Build query
    const query = {
      userId
    };

    if (category) {
      query.category = category;
    }

    if (isArchived !== undefined) {
      query.isArchived = isArchived === 'true' || isArchived === true;
    }

    // Filter for documents expiring within next 30 days
    if (expiringSoon === 'true' || expiringSoon === true) {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      query.expiryDate = {
        $gte: now,
        $lte: thirtyDaysFromNow
      };
      query.isArchived = false; // Only show active documents
    }

    // Fetch documents
    const documents = await VaultDocument.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Don't expose full Cloudinary URLs in list view
    const sanitizedDocs = documents.map(doc => ({
      ...doc,
      file: {
        ...doc.file,
        url: undefined // Remove URL from list view
      }
    }));

    return sanitizedDocs;
  } catch (error) {
    logger.error(`Get vault documents error: ${error.message}`);
    throw error;
  }
};

/**
 * Get a single vault document by ID
 */
export const getVaultDocumentById = async (documentId, userId) => {
  try {
    const vaultDocument = await VaultDocument.findOne({
      _id: documentId,
      userId
    }).lean();

    if (!vaultDocument) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Don't expose full URL in detail view either
    const docObj = {
      ...vaultDocument,
      file: {
        ...vaultDocument.file,
        url: undefined
      }
    };

    return docObj;
  } catch (error) {
    logger.error(`Get vault document by ID error: ${error.message}`);
    throw error;
  }
};

/**
 * Get signed URL for document access
 */
export const getDocumentSignedUrl = async (documentId, userId) => {
  try {
    const vaultDocument = await VaultDocument.findOne({
      _id: documentId,
      userId,
      isArchived: false
    });

    if (!vaultDocument) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Generate time-limited signed URL (60 seconds)
    const signedUrl = generateSignedUrl(vaultDocument.file.publicId, 60);

    return {
      signedUrl,
      expiresIn: 60 // seconds
    };
  } catch (error) {
    logger.error(`Get document signed URL error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete (archive) a vault document
 */
export const deleteVaultDocument = async (documentId, userId) => {
  try {
    const vaultDocument = await VaultDocument.findOne({
      _id: documentId,
      userId
    });

    if (!vaultDocument) {
      throw new Error(MESSAGES.NOT_FOUND);
    }

    // Delete file from Cloudinary
    try {
      await deleteDocument(vaultDocument.file.publicId);
    } catch (error) {
      logger.error(`Failed to delete document from Cloudinary: ${error.message}`);
      // Continue with soft delete even if Cloudinary deletion fails
    }

    // Soft delete (set isArchived = true)
    await VaultDocument.findByIdAndUpdate(
      documentId,
      {
        isArchived: true
      },
      {
        new: true
      }
    );

    return { success: true };
  } catch (error) {
    logger.error(`Delete vault document error: ${error.message}`);
    throw error;
  }
};
