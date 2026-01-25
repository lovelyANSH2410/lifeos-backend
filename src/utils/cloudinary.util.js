import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';
import logger from './logger.util.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {Buffer|string} file - File buffer or file path
 * @param {string} folder - Folder path in Cloudinary (e.g., 'diary-entries')
 * @returns {Promise<Object>} Cloudinary upload result with metadata
 */
export const uploadImage = async (file, folder = 'diary-entries') => {
  try {
    // Handle file object from multer or raw buffer
    let fileBuffer = file;
    let mimeType = 'image/jpeg';
    
    if (file && file.buffer) {
      // Multer file object
      fileBuffer = file.buffer;
      mimeType = file.mimetype || 'image/jpeg';
    } else if (Buffer.isBuffer(file)) {
      // Raw buffer
      fileBuffer = file;
    } else {
      throw new Error('Invalid file format');
    }

    // Convert buffer to data URI
    const base64 = fileBuffer.toString('base64');
    const fileData = `data:${mimeType};base64,${base64}`;

    // Validate file size before uploading to Cloudinary
    // Cloudinary free tier has a 10MB limit per file
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (fileBuffer.length > maxFileSize) {
      throw new Error('File size exceeds Cloudinary limit. Maximum size is 10MB');
    }

    const result = await cloudinary.uploader.upload(fileData, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        {
          quality: 'auto',
          fetch_format: 'auto'
        }
      ],
      // Free tier best practices
      overwrite: false,
      invalidate: true,
      // Additional size validation
      max_file_size: maxFileSize
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    logger.error(`Cloudinary upload error: ${error.message}`);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Failed to delete image: ${result.result}`);
    }

    return result;
  } catch (error) {
    logger.error(`Cloudinary delete error: ${error.message}`);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export const deleteImages = async (publicIds) => {
  try {
    if (!publicIds || publicIds.length === 0) {
      return { deleted: [] };
    }

    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: 'image',
      invalidate: true
    });

    return result;
  } catch (error) {
    logger.error(`Cloudinary bulk delete error: ${error.message}`);
    throw new Error('Failed to delete images from Cloudinary');
  }
};

/**
 * Upload a document to Cloudinary (raw resource type)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<Object>} Upload result with publicId, url, format, size
 */
export const uploadDocument = async (fileBuffer, originalName, folder = 'lifeos/documents') => {
  try {
    // Validate file size before uploading to Cloudinary
    // Cloudinary free tier has a 10MB limit per file
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (fileBuffer.length > maxFileSize) {
      throw new Error('File size exceeds Cloudinary limit. Maximum size is 10MB');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: folder,
          public_id: originalName.replace(/\.[^/.]+$/, ''), // Remove extension
          allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
          format: 'auto',
        },
        (error, result) => {
          if (error) {
            logger.error(`Failed to upload document: ${error.message}`);
            reject(error);
          } else {
            logger.info(`Document uploaded successfully: ${result.public_id}`);
            resolve({
              publicId: result.public_id,
              url: result.secure_url,
              format: result.format || originalName.split('.').pop(),
              size: result.bytes
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    logger.error(`Upload document error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a document from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteDocument = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
      invalidate: true
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Failed to delete document: ${result.result}`);
    }

    logger.info(`Deleted document from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`Failed to delete document: ${error.message}`);
    throw error;
  }
};

/**
 * Generate a signed URL for document access (time-limited)
 * @param {string} publicId - Cloudinary public ID
 * @param {number} expiresIn - Expiration time in seconds (default 60)
 * @returns {string} Signed URL
 */
export const generateSignedUrl = (publicId, expiresIn = 60) => {
  try {
    const url = cloudinary.utils.url(publicId, {
      resource_type: 'raw',
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn
    });

    return url;
  } catch (error) {
    logger.error(`Failed to generate signed URL: ${error.message}`);
    throw error;
  }
};

export default cloudinary;
