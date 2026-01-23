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
      invalidate: true
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

export default cloudinary;
