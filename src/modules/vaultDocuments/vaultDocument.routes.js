import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import * as vaultDocumentController from './vaultDocument.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only allowed file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed types: PDF, JPG, JPEG, PNG, WEBP'), false);
    }
  }
});

// Rate limiter for document upload endpoint
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per windowMs
  message: {
    success: false,
    message: 'Too many upload requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB'
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
  uploadLimiter,
  upload.single('file'),
  handleMulterError,
  vaultDocumentController.createVaultDocument
);

router.get('/', vaultDocumentController.getVaultDocuments);

router.get('/:id', vaultDocumentController.getVaultDocumentById);

router.get('/:id/url', vaultDocumentController.getDocumentSignedUrl);

router.delete('/:id', vaultDocumentController.deleteVaultDocument);

export default router;
