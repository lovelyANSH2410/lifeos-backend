import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.util.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Global upload rate limiter
 * Prevents abuse by limiting upload requests per user/IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Maximum 30 upload requests per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many upload requests. Please try again in a few minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for authenticated users in development (optional)
    // In production, keep this enabled for all users
    return false;
  }
});

/**
 * Strict upload rate limiter for large files
 * Used for document uploads and other sensitive endpoints
 */
export const strictUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Maximum 10 large file uploads per hour per IP
  message: {
    success: false,
    message: 'Upload limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Daily upload limit per user
 * This middleware should be used after authentication
 * Tracks uploads per user per day
 */
export const dailyUploadLimiter = async (req, res, next) => {
  try {
    // This would ideally use Redis or a database to track daily uploads per user
    // For now, we'll rely on rate limiting by IP
    // TODO: Implement per-user daily upload tracking with Redis/database
    
    // Placeholder: In production, check user's daily upload count from database
    // const userId = req.user.id;
    // const todayUploads = await getTodayUploadCount(userId);
    // const maxDailyUploads = 100; // Adjust based on subscription plan
    
    // if (todayUploads >= maxDailyUploads) {
    //   return sendError(res, 'Daily upload limit reached. Please try again tomorrow.', HTTP_STATUS.TOO_MANY_REQUESTS);
    // }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * File type validator middleware
 * Ensures only allowed file types are uploaded
 */
export const validateFileType = (allowedTypes = ['image']) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file].filter(Boolean);
    const allowedMimeTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      document: ['application/pdf'],
      video: [] // Videos are explicitly blocked for now
    };

    const allowedMimes = allowedTypes.flatMap(type => allowedMimeTypes[type] || []);

    for (const file of files) {
      if (!allowedMimes.includes(file.mimetype)) {
        return sendError(
          res,
          `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Explicitly block video files
      if (file.mimetype.startsWith('video/')) {
        return sendError(
          res,
          'Video files are not allowed. Please upload images or documents only.',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    next();
  };
};

/**
 * Total file size validator
 * Ensures combined file sizes don't exceed a limit
 */
export const validateTotalFileSize = (maxTotalSize = 50 * 1024 * 1024) => { // 50MB default
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file].filter(Boolean);
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

    if (totalSize > maxTotalSize) {
      return sendError(
        res,
        `Total file size exceeds limit. Maximum total size: ${Math.round(maxTotalSize / 1024 / 1024)}MB`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    next();
  };
};
