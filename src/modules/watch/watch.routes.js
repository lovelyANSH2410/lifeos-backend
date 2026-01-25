import express from 'express';
import multer from 'multer';
import * as watchController from './watch.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
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
        message: 'File size too large. Maximum size is 5MB'
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
  upload.single('poster'),
  handleMulterError,
  watchController.createWatchItem
);

router.get('/', watchController.getWatchItems);

router.get('/:id', watchController.getWatchItemById);

router.patch('/:id', watchController.updateWatchItem);

router.patch('/:id/progress', watchController.updateWatchProgress);

router.delete('/:id', watchController.deleteWatchItem);

export default router;
