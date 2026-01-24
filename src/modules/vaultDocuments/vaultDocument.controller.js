import { sendSuccess, sendError, sendValidationError } from '../../utils/response.util.js';
import { HTTP_STATUS, MESSAGES } from '../../config/constants.js';
import * as vaultDocumentService from './vaultDocument.service.js';
import logger from '../../utils/logger.util.js';

/**
 * Create a new vault document
 */
export const createVaultDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      category,
      issuedDate,
      expiryDate,
      notes
    } = req.body;
    const file = req.file;

    // Validate required fields
    if (!title || !title.trim()) {
      return sendValidationError(res, [{
        field: 'title',
        message: 'Title is required'
      }]);
    }

    if (title.trim().length > 150) {
      return sendValidationError(res, [{
        field: 'title',
        message: 'Title cannot exceed 150 characters'
      }]);
    }

    if (!file) {
      return sendValidationError(res, [{
        field: 'file',
        message: 'File is required'
      }]);
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return sendValidationError(res, [{
        field: 'file',
        message: 'File type not allowed. Allowed types: PDF, JPG, JPEG, PNG, WEBP'
      }]);
    }

    // Validate file size (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return sendValidationError(res, [{
        field: 'file',
        message: 'File size exceeds 10MB limit'
      }]);
    }

    // Validate category
    const validCategories = ['identity', 'insurance', 'finance', 'medical', 'property', 'education', 'other'];
    if (category && !validCategories.includes(category)) {
      return sendValidationError(res, [{
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      }]);
    }

    // Validate notes length
    if (notes && notes.length > 1000) {
      return sendValidationError(res, [{
        field: 'notes',
        message: 'Notes cannot exceed 1000 characters'
      }]);
    }

    // Validate dates
    let issuedDateObj = null;
    let expiryDateObj = null;

    if (issuedDate) {
      issuedDateObj = new Date(issuedDate);
      if (isNaN(issuedDateObj.getTime())) {
        return sendValidationError(res, [{
          field: 'issuedDate',
          message: 'Invalid issued date format'
        }]);
      }
    }

    if (expiryDate) {
      expiryDateObj = new Date(expiryDate);
      if (isNaN(expiryDateObj.getTime())) {
        return sendValidationError(res, [{
          field: 'expiryDate',
          message: 'Invalid expiry date format'
        }]);
      }
    }

    // Validate expiry date is after issued date if both provided
    if (issuedDateObj && expiryDateObj && expiryDateObj < issuedDateObj) {
      return sendValidationError(res, [{
        field: 'expiryDate',
        message: 'Expiry date must be after issued date'
      }]);
    }

    const documentData = {
      title: title.trim(),
      category: category || 'other',
      issuedDate: issuedDateObj,
      expiryDate: expiryDateObj,
      notes: notes?.trim()
    };

    const vaultDocument = await vaultDocumentService.createVaultDocument(
      userId,
      documentData,
      file.buffer,
      file.originalname
    );

    return sendSuccess(
      res,
      vaultDocument,
      'Document uploaded successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create vault document controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get vault documents for the logged-in user
 */
export const getVaultDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      category,
      expiringSoon,
      isArchived
    } = req.query;

    const filters = {
      category,
      expiringSoon,
      isArchived
    };

    const documents = await vaultDocumentService.getVaultDocuments(userId, filters);

    return sendSuccess(res, documents, 'Documents retrieved successfully');
  } catch (error) {
    logger.error(`Get vault documents controller error: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single vault document by ID
 */
export const getVaultDocumentById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const document = await vaultDocumentService.getVaultDocumentById(id, userId);

    return sendSuccess(res, document, 'Document retrieved successfully');
  } catch (error) {
    logger.error(`Get vault document by ID controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Get signed URL for document access
 */
export const getDocumentSignedUrl = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await vaultDocumentService.getDocumentSignedUrl(id, userId);

    return sendSuccess(res, result, 'Signed URL generated successfully');
  } catch (error) {
    logger.error(`Get document signed URL controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};

/**
 * Delete (archive) a vault document
 */
export const deleteVaultDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await vaultDocumentService.deleteVaultDocument(id, userId);

    return sendSuccess(res, null, 'Document deleted successfully');
  } catch (error) {
    logger.error(`Delete vault document controller error: ${error.message}`);
    
    if (error.message === MESSAGES.NOT_FOUND) {
      return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
    }

    next(error);
  }
};
