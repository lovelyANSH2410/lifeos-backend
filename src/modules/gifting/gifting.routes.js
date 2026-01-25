import express from 'express';
import multer from 'multer';
import * as giftingController from './gifting.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { uploadRateLimiter } from '../../middlewares/uploadLimit.middleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 3 // Maximum 3 images
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB per file'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 3 images'
      });
    }
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// All routes require authentication
router.use(authenticate);

// Routes
router.post(
  '/',
  uploadRateLimiter, // Global upload rate limiting
  upload.array('images', 3),
  handleMulterError,
  giftingController.createGiftIdea
);

router.get('/', giftingController.getGiftIdeas);

router.get('/:id', giftingController.getGiftIdeaById);

router.patch('/:id', giftingController.updateGiftIdea);

router.delete('/:id', giftingController.deleteGiftIdea);

export default router;
