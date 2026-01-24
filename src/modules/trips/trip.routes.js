import express from 'express';
import multer from 'multer';
import * as tripController from './trip.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
  upload.single('coverImage'),
  handleMulterError,
  tripController.createTrip
);

router.get('/', tripController.getTrips);

router.get('/summary', tripController.getTripSummary);

router.get('/:id', tripController.getTripById);

router.patch(
  '/:id',
  upload.single('coverImage'),
  handleMulterError,
  tripController.updateTrip
);

router.delete('/:id', tripController.deleteTrip);

export default router;
