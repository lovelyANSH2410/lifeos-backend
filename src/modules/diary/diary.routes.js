import express from 'express';
import multer from 'multer';
import * as diaryController from './diary.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { uploadRateLimiter } from '../../middlewares/uploadLimit.middleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Maximum 5 images per entry
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

// All routes require authentication
router.use(authenticate);

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
        message: 'Too many files. Maximum is 5 images per entry'
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

// Routes
router.post(
  '/',
  uploadRateLimiter, // Global upload rate limiting
  upload.array('images', 5),
  handleMulterError,
  diaryController.createEntry
);

router.get('/', diaryController.getEntries);

router.get('/:id', diaryController.getEntryById);

router.delete('/:id', diaryController.archiveEntry);

export default router;
