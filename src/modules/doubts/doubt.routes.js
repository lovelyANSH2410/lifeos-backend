import express from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { uploadRateLimiter } from '../../middlewares/uploadLimit.middleware.js';
import * as doubtController from './doubt.controller.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
    files: 5 // max 5 images per request
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
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 images'
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

router.use(authenticate);

// Subject-scoped doubts
router.post(
  '/subjects/:subjectId/doubts',
  uploadRateLimiter,
  upload.array('images', 5),
  handleMulterError,
  doubtController.createDoubt
);
router.get('/subjects/:subjectId/doubts', doubtController.getDoubtsBySubject);

// Doubt-scoped operations
router.get('/doubts/:id', doubtController.getDoubtById);
router.put(
  '/doubts/:id',
  uploadRateLimiter,
  upload.array('images', 5),
  handleMulterError,
  doubtController.updateDoubt
);
router.put('/doubts/:id/resolve', doubtController.resolveDoubt);
router.delete('/doubts/:id', doubtController.deleteDoubt);

export default router;


